import { useState } from 'react'
import { getCurrentSlot, getSlotEndTime } from '../constants'
import { useEntries } from '../hooks/useEntries'
import { useReminder } from '../hooks/useReminder'
import { ActivityInput } from '../components/ActivityInput'
import { EnergyPicker } from '../components/EnergyPicker'
import { CostPicker } from '../components/CostPicker'
import type { EnergyType, CostType } from '../types'

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

  return (
    <div className="page quick-record">
      {showReminder && (
        <div className="reminder-bar" onClick={dismiss}>
          ⏰ 該記錄了！過去 30 分鐘做了什麼？
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}

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
    </div>
  )
}
