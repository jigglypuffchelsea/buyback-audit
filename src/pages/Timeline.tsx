import { useState, useMemo } from 'react'
import { generateDaySlots, formatDate, getSlotEndTime, getInterval, setInterval as setIntervalSetting, type IntervalType } from '../constants'
import { getStartDate, setStartDate as saveStartDate } from '../api'
import { useEntries } from '../hooks/useEntries'
import { ActivityInput } from '../components/ActivityInput'
import { EnergyPicker } from '../components/EnergyPicker'
import { CostPicker } from '../components/CostPicker'
import type { TimeEntry, EnergyType, CostType } from '../types'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return date
}

function getWeekDates(monday: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return formatDate(d)
  })
}

function getCellClass(entry: TimeEntry | undefined): string {
  if (!entry) return 'wk-empty'
  if (entry.activity === '睡覺' || entry.activity === 'Sleep') return 'wk-sleep'
  if (entry.energy === 'green') return 'wk-green'
  if (entry.energy === 'red') return 'wk-red'
  return 'wk-recorded'
}

export function Timeline() {
  const startDate = getStartDate()
  const [interval, setLocalInterval] = useState<IntervalType>(getInterval)
  const [weekOffset, setWeekOffset] = useState(0)

  // Fetch ALL entries for week view
  const { entries, addEntry, updateEntry, removeEntry, loading } = useEntries()

  // Edit modal
  const [editDate, setEditDate] = useState('')
  const [editSlot, setEditSlot] = useState<string | null>(null)
  const [editActivity, setEditActivity] = useState('')
  const [editEnergy, setEditEnergy] = useState<EnergyType>(null)
  const [editCost, setEditCost] = useState<CostType>(null)
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null)

  const slots = generateDaySlots(interval)

  const handleIntervalChange = (val: IntervalType) => {
    setIntervalSetting(val)
    setLocalInterval(val)
  }

  if (!startDate) {
    const today = formatDate(new Date())
    return (
      <div className="page timeline">
        <div className="setup-card">
          <h2>開始你的 14 天追蹤</h2>
          <p>開始日期設為今天 ({today})?</p>
          <button className="save-btn" onClick={() => saveStartDate(today)}>
            開始追蹤
          </button>
        </div>
      </div>
    )
  }

  // Week dates
  const monday = getMonday(new Date())
  monday.setDate(monday.getDate() + weekOffset * 7)
  const weekDates = getWeekDates(monday)
  const todayStr = formatDate(new Date())

  // Index entries by date+time for fast lookup
  const entryMap = useMemo(() => {
    const map = new Map<string, TimeEntry>()
    entries.forEach(e => map.set(`${e.date}|${e.startTime}`, e))
    return map
  }, [entries])

  const getEntry = (date: string, time: string) => entryMap.get(`${date}|${time}`)

  const openEdit = (date: string, time: string) => {
    const entry = getEntry(date, time)
    setEditDate(date)
    setEditSlot(time)
    setEditEntry(entry || null)
    setEditActivity(entry?.activity || '')
    setEditEnergy(entry?.energy || null)
    setEditCost(entry?.delegationCost || null)
  }

  const handleSave = async () => {
    if (!editSlot || !editActivity.trim()) return
    if (editEntry) {
      await updateEntry({ ...editEntry, activity: editActivity.trim(), energy: editEnergy, delegationCost: editCost })
    } else {
      await addEntry(editDate, editSlot, editActivity.trim(), editEnergy, editCost)
    }
    setEditSlot(null)
  }

  const handleDelete = async () => {
    if (editEntry) {
      await removeEntry(editEntry.id)
      setEditSlot(null)
    }
  }

  // Week label
  const weekStart = weekDates[0]
  const weekEnd = weekDates[6]
  const ws = new Date(weekStart)
  const we = new Date(weekEnd)
  const weekLabel = `${ws.getMonth() + 1}/${ws.getDate()} - ${we.getMonth() + 1}/${we.getDate()}`

  return (
    <div className="page timeline week-view">
      {/* Week nav */}
      <div className="date-nav">
        <button onClick={() => setWeekOffset(w => w - 1)}>◀</button>
        <span>{weekLabel}</span>
        <button onClick={() => setWeekOffset(w => w + 1)}>▶</button>
      </div>

      <div className="interval-toggle">
        <button className={interval === 30 ? 'active' : ''} onClick={() => handleIntervalChange(30)}>30 分</button>
        <button className={interval === 60 ? 'active' : ''} onClick={() => handleIntervalChange(60)}>1 小時</button>
      </div>

      {loading ? (
        <div className="loading">載入中...</div>
      ) : (
        <div className="wk-scroll">
          <table className="wk-table">
            <thead>
              <tr>
                <th className="wk-time-col"></th>
                {weekDates.map((date, i) => {
                  const d = new Date(date)
                  const isToday = date === todayStr
                  return (
                    <th key={date} className={`wk-day-header ${isToday ? 'wk-today-header' : ''}`}>
                      <span className="wk-weekday">{WEEKDAYS[i]}</span>
                      <span className={`wk-date-num ${isToday ? 'wk-today-num' : ''}`}>
                        {d.getDate()}
                      </span>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {slots.map(time => (
                <tr key={time}>
                  <td className="wk-time-label">{time}</td>
                  {weekDates.map(date => {
                    const entry = getEntry(date, time)
                    const cls = getCellClass(entry)
                    return (
                      <td
                        key={date}
                        className={`wk-cell ${cls}`}
                        onClick={() => openEdit(date, time)}
                      >
                        {entry && (
                          <span className="wk-cell-text">
                            {entry.activity}
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit modal */}
      {editSlot && (
        <div className="modal-overlay" onClick={() => setEditSlot(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>
              {new Date(editDate).getMonth() + 1}/{new Date(editDate).getDate()}
              {' '}{editSlot} - {getSlotEndTime(editSlot)}
            </h3>
            <ActivityInput value={editActivity} onChange={setEditActivity} autoFocus />
            <EnergyPicker value={editEnergy} onChange={setEditEnergy} />
            <CostPicker value={editCost} onChange={setEditCost} />
            <div className="modal-actions">
              <button className="save-btn" onClick={handleSave} disabled={!editActivity.trim()}>
                儲存
              </button>
              {editEntry && (
                <button className="delete-btn" onClick={handleDelete}>刪除</button>
              )}
              <button className="cancel-btn" onClick={() => setEditSlot(null)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
