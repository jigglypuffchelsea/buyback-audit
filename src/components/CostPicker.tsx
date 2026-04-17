import type { CostType } from '../types'

interface Props {
  value: CostType
  onChange: (v: CostType) => void
}

const COST_LEVELS: { value: 1 | 2 | 3 | 4; label: string }[] = [
  { value: 1, label: '$' },
  { value: 2, label: '$$' },
  { value: 3, label: '$$$' },
  { value: 4, label: '$$$$' },
]

export function CostPicker({ value, onChange }: Props) {
  return (
    <div className="cost-picker">
      <span className="picker-label">委託成本</span>
      <div className="picker-buttons">
        {COST_LEVELS.map(c => (
          <button
            key={c.value}
            type="button"
            className={`cost-btn ${value === c.value ? 'active' : ''}`}
            onClick={() => onChange(value === c.value ? null : c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  )
}
