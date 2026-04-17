import type { EnergyType } from '../types'

interface Props {
  value: EnergyType
  onChange: (v: EnergyType) => void
}

export function EnergyPicker({ value, onChange }: Props) {
  return (
    <div className="energy-picker">
      <span className="picker-label">能量</span>
      <div className="picker-buttons">
        <button
          type="button"
          className={`energy-btn energy-green ${value === 'green' ? 'active' : ''}`}
          onClick={() => onChange(value === 'green' ? null : 'green')}
        >
          <span className="energy-dot green" />
          有能量
        </button>
        <button
          type="button"
          className={`energy-btn energy-red ${value === 'red' ? 'active' : ''}`}
          onClick={() => onChange(value === 'red' ? null : 'red')}
        >
          <span className="energy-dot red" />
          消耗
        </button>
      </div>
    </div>
  )
}
