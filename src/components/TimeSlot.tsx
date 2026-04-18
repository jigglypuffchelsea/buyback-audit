import type { TimeEntry } from '../types'
import { getSlotEndTime } from '../constants'

interface Props {
  time: string
  entry: TimeEntry | null
  onTap: () => void
}

const COST_LABELS = ['', '$', '$$', '$$$', '$$$$']

export function TimeSlot({ time, entry, onTap }: Props) {
  const endTime = getSlotEndTime(time)

  const isSleep = entry?.activity === '睡覺'
  let statusClass = 'slot-empty'
  if (isSleep) statusClass = 'slot-sleep'
  else if (entry?.energy) statusClass = `slot-${entry.energy}`
  else if (entry) statusClass = 'slot-recorded'

  return (
    <button className={`time-slot ${statusClass}`} onClick={onTap}>
      <span className="slot-time">{time}-{endTime}</span>
      {entry ? (
        <span className="slot-activity">{entry.activity}</span>
      ) : (
        <span className="slot-empty-label">點擊記錄</span>
      )}
      {entry?.delegationCost && (
        <span className="slot-cost">{COST_LABELS[entry.delegationCost]}</span>
      )}
    </button>
  )
}
