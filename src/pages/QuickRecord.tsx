import { useState } from 'react'
import { getCurrentSlot, getSlotEndTime, formatDate, formatTime, getInterval } from '../constants'
import { useEntries } from '../hooks/useEntries'
import { useReminder } from '../hooks/useReminder'
import { getSleepState, setSleepState, clearSleepState } from '../api'
import { ActivityInput } from '../components/ActivityInput'
import { EnergyPicker } from '../components/EnergyPicker'
import { CostPicker } from '../components/CostPicker'
import type { EnergyType, CostType } from '../types'

export const SLEEP_ACTIVITY = '睡覺'

export function QuickRecord() {
  const slot = getCurrentSlot()
  const { addEntry, getEntryForSlot } = useEntries(slot.date)
  const { showReminder, dismiss } = useReminder()

  const [activity, setActivity] = useState('')
  const [energy, setEnergy] = useState<EnergyType>(null)
  const [cost, setCost] = useState<CostType>(null)
  const [showExtra, setShowExtra] = useState(false)
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)
  const [sleep, setSleep] = useState(getSleepState)

  const existing = getEntryForSlot(slot.startTime)

  const handleSave = async () => {
    if (!activity.trim()) return
    setSaving(true)
    await addEntry(slot.date, slot.startTime, activity.trim(), energy, cost)
    setToast('已記錄 ✓')
    setActivity('')
    setEnergy(null)
    setCost(null)
    setShowExtra(false)
    setSaving(false)
    setTimeout(() => setToast(''), 2000)
  }

  const handleSleep = () => {
    const state = { sleeping: true, sleepStart: new Date().toISOString() }
    setSleepState(state)
    setSleep(state)
    setToast('晚安 🌙')
    setTimeout(() => setToast(''), 2000)
  }

  const handleWake = async () => {
    if (!sleep.sleepStart) return
    setSaving(true)

    const sleepStart = new Date(sleep.sleepStart)
    const now = new Date()
    const interval = getInterval()

    // Generate all slots between sleep start and now
    // Floor sleepStart to nearest interval
    const startMin = sleepStart.getHours() * 60 + sleepStart.getMinutes()
    const flooredStartMin = Math.floor(startMin / interval) * interval
    const cursor = new Date(sleepStart)
    cursor.setHours(Math.floor(flooredStartMin / 60), flooredStartMin % 60, 0, 0)

    let count = 0
    while (cursor < now) {
      const trackingDate = new Date(cursor)
      // 00:00-01:30 belongs to previous tracking day
      if (trackingDate.getHours() < 2) {
        trackingDate.setDate(trackingDate.getDate() - 1)
      }

      const dateStr = formatDate(trackingDate)
      const timeStr = formatTime(cursor)

      await addEntry(dateStr, timeStr, SLEEP_ACTIVITY, null, null)
      count++

      cursor.setMinutes(cursor.getMinutes() + interval)
    }

    clearSleepState()
    setSleep({ sleeping: false, sleepStart: '' })
    setSaving(false)
    setToast(`早安 ☀️ 已記錄 ${count} 個睡眠時段`)
    setTimeout(() => setToast(''), 3000)
  }

  const handleCancelSleep = () => {
    clearSleepState()
    setSleep({ sleeping: false, sleepStart: '' })
    setToast('已取消')
    setTimeout(() => setToast(''), 2000)
  }

  // Calculate sleep duration
  const sleepDuration = sleep.sleeping
    ? (() => {
        const ms = Date.now() - new Date(sleep.sleepStart).getTime()
        const h = Math.floor(ms / 3600000)
        const m = Math.floor((ms % 3600000) / 60000)
        return `${h} 小時 ${m} 分`
      })()
    : ''

  const sleepStartTime = sleep.sleeping
    ? new Date(sleep.sleepStart).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div className="page quick-record">
      {showReminder && !sleep.sleeping && (
        <div className="reminder-bar" onClick={dismiss}>
          ⏰ 該記錄了！過去 30 分鐘做了什麼？
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}

      {/* Sleep mode */}
      {sleep.sleeping ? (
        <div className="record-card sleep-card">
          <div className="sleep-icon">🌙</div>
          <h1>睡眠中</h1>
          <p className="sleep-since">從 {sleepStartTime} 開始</p>
          <p className="sleep-duration">{sleepDuration}</p>
          <button
            className="save-btn wake-btn"
            onClick={handleWake}
            disabled={saving}
          >
            {saving ? '記錄中...' : '☀️ 起床'}
          </button>
          <button className="cancel-sleep-btn" onClick={handleCancelSleep}>
            誤按？取消睡覺
          </button>
        </div>
      ) : (
        <>
          {/* Sleep button */}
          <button className="sleep-btn" onClick={handleSleep}>
            🌙 睡覺
          </button>

          {/* Normal recording */}
          <div className="record-card">
            <h1>過去 30 分鐘做了什麼？</h1>

            <div className="time-badge">
              ⏰ {slot.startTime} - {getSlotEndTime(slot.startTime)}
            </div>

            {existing ? (
              <div className="already-recorded">
                <p>這個時段已記錄：</p>
                <p className="recorded-activity">{existing.activity}</p>
              </div>
            ) : (
              <>
                <ActivityInput value={activity} onChange={setActivity} autoFocus />

                <button
                  className="toggle-extra"
                  onClick={() => setShowExtra(!showExtra)}
                >
                  {showExtra ? '收合標記 ▲' : '展開能量/成本標記 ▼'}
                </button>

                {showExtra && (
                  <div className="extra-fields">
                    <EnergyPicker value={energy} onChange={setEnergy} />
                    <CostPicker value={cost} onChange={setCost} />
                  </div>
                )}

                <button
                  className="save-btn"
                  onClick={handleSave}
                  disabled={!activity.trim() || saving}
                >
                  {saving ? '儲存中...' : '✓ 記錄'}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
