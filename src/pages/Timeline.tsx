import { useState } from 'react'
import { generateDaySlots, formatDate, getSlotEndTime, AUDIT_DAYS, getInterval, setInterval as setIntervalSetting, type IntervalType } from '../constants'
import { getStartDate, setStartDate as saveStartDate } from '../api'
import { useEntries } from '../hooks/useEntries'
import { TimeSlot } from '../components/TimeSlot'
import { ActivityInput } from '../components/ActivityInput'
import { EnergyPicker } from '../components/EnergyPicker'
import { CostPicker } from '../components/CostPicker'
import type { TimeEntry, EnergyType, CostType } from '../types'

export function Timeline() {
  const startDate = getStartDate()
  const [currentDate, setCurrentDate] = useState(() => {
    return startDate || formatDate(new Date())
  })
  const [interval, setLocalInterval] = useState<IntervalType>(getInterval)
  const { entries, addEntry, updateEntry, removeEntry, getEntryForSlot, loading } = useEntries(currentDate)

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
          <button className="save-btn" onClick={() => {
            saveStartDate(today)
            setCurrentDate(today)
          }}>
            開始追蹤
          </button>
        </div>
      </div>
    )
  }

  const start = new Date(startDate)
  const current = new Date(currentDate)
  const dayNum = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][current.getDay()]

  const goDay = (offset: number) => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + offset)
    const diff = Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    if (diff >= 0 && diff < AUDIT_DAYS) {
      setCurrentDate(formatDate(d))
    }
  }

  const openEdit = (slotTime: string) => {
    const entry = getEntryForSlot(slotTime)
    setEditSlot(slotTime)
    setEditEntry(entry)
    setEditActivity(entry?.activity || '')
    setEditEnergy(entry?.energy || null)
    setEditCost(entry?.delegationCost || null)
  }

  const handleSave = async () => {
    if (!editSlot || !editActivity.trim()) return
    if (editEntry) {
      await updateEntry({
        ...editEntry,
        activity: editActivity.trim(),
        energy: editEnergy,
        delegationCost: editCost,
      })
    } else {
      await addEntry(currentDate, editSlot, editActivity.trim(), editEnergy, editCost)
    }
    setEditSlot(null)
  }

  const handleDelete = async () => {
    if (editEntry) {
      await removeEntry(editEntry.id)
      setEditSlot(null)
    }
  }

  const filledCount = entries.length
  const totalSlots = slots.length

  return (
    <div className="page timeline">
      <div className="date-nav">
        <button onClick={() => goDay(-1)} disabled={dayNum <= 1}>◀</button>
        <span>
          {current.getMonth() + 1}/{current.getDate()}（{weekday}）第 {dayNum} 天
        </span>
        <button onClick={() => goDay(1)} disabled={dayNum >= AUDIT_DAYS}>▶</button>
      </div>

      <div className="interval-toggle">
        <button
          className={interval === 30 ? 'active' : ''}
          onClick={() => handleIntervalChange(30)}
        >30 分鐘</button>
        <button
          className={interval === 60 ? 'active' : ''}
          onClick={() => handleIntervalChange(60)}
        >1 小時</button>
      </div>

      <div className="fill-rate">
        已記錄 {filledCount}/{totalSlots} 格
        <div className="fill-bar">
          <div className="fill-progress" style={{ width: `${(filledCount / totalSlots) * 100}%` }} />
        </div>
      </div>

      {loading ? (
        <div className="loading">載入中...</div>
      ) : (
        <div className="slot-list">
          {slots.map(time => (
            <TimeSlot
              key={time}
              time={time}
              entry={getEntryForSlot(time)}
              onTap={() => openEdit(time)}
            />
          ))}
        </div>
      )}

      {editSlot && (
        <div className="modal-overlay" onClick={() => setEditSlot(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editSlot} - {getSlotEndTime(editSlot)}</h3>
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
