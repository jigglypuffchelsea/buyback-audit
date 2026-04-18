import type { TimeEntry } from '../types'
import { getSlotDuration } from '../constants'

interface Props {
  entries: TimeEntry[]
}

interface Cell {
  label: string
  highlight?: boolean
  items: { activity: string; minutes: number }[]
}

export function Matrix({ entries }: Props) {
  const tagged = entries.filter(e => e.energy && e.delegationCost)

  const aggregate = (filter: (e: TimeEntry) => boolean) => {
    const map = new Map<string, number>()
    tagged.filter(filter).forEach(e => {
      map.set(e.activity, (map.get(e.activity) || 0) + getSlotDuration())
    })
    return Array.from(map.entries())
      .map(([activity, minutes]) => ({ activity, minutes }))
      .sort((a, b) => b.minutes - a.minutes)
  }

  const cells: Cell[][] = [
    [
      {
        label: '🔴 消耗 + 💲 低成本',
        highlight: true,
        items: aggregate(e => e.energy === 'red' && (e.delegationCost === 1 || e.delegationCost === 2)),
      },
      {
        label: '🔴 消耗 + 💰 高成本',
        items: aggregate(e => e.energy === 'red' && (e.delegationCost === 3 || e.delegationCost === 4)),
      },
    ],
    [
      {
        label: '🟢 有能量 + 💲 低成本',
        items: aggregate(e => e.energy === 'green' && (e.delegationCost === 1 || e.delegationCost === 2)),
      },
      {
        label: '🟢 有能量 + 💰 高成本',
        items: aggregate(e => e.energy === 'green' && (e.delegationCost === 3 || e.delegationCost === 4)),
      },
    ],
  ]

  return (
    <div className="matrix">
      <div className="matrix-header">
        <span />
        <span>低成本 ($-$$)</span>
        <span>高成本 ($$$-$$$$)</span>
      </div>
      {cells.map((row, ri) => (
        <div key={ri} className="matrix-row">
          <span className="matrix-row-label">{ri === 0 ? '🔴 消耗' : '🟢 有能量'}</span>
          {row.map((cell, ci) => (
            <div key={ci} className={`matrix-cell ${cell.highlight ? 'matrix-highlight' : ''}`}>
              {cell.highlight && <div className="matrix-badge">立刻外包</div>}
              {cell.items.length === 0 ? (
                <span className="matrix-empty">尚無資料</span>
              ) : (
                <ul>
                  {cell.items.slice(0, 5).map(item => (
                    <li key={item.activity}>
                      {item.activity}
                      <span className="matrix-minutes">{item.minutes}分</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
