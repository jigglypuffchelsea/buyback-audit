import { useState, useRef, useEffect } from 'react'
import { getRecentActivities } from '../api'

interface Props {
  value: string
  onChange: (v: string) => void
  autoFocus?: boolean
}

export function ActivityInput({ value, onChange, autoFocus }: Props) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const recent = getRecentActivities()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const filtered = value
    ? recent.filter(a => a.includes(value) && a !== value)
    : recent

  return (
    <div className="activity-input">
      <input
        ref={inputRef}
        type="text"
        placeholder="回覆 LINE、開會、運動..."
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
      />
      {showSuggestions && filtered.length > 0 && (
        <div className="suggestions">
          {filtered.slice(0, 6).map(a => (
            <button key={a} type="button" onMouseDown={() => onChange(a)}>
              {a}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
