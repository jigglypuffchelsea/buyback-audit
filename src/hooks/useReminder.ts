import { useEffect, useState } from 'react'
import { isInActiveHours } from '../constants'

export function useReminder() {
  const [showReminder, setShowReminder] = useState(false)

  useEffect(() => {
    const check = () => {
      const now = new Date()
      const m = now.getMinutes()
      // Trigger at :00 and :30 (within first minute of the slot)
      if ((m === 0 || m === 30) && isInActiveHours()) {
        setShowReminder(true)
        // Auto-dismiss after 30 seconds
        setTimeout(() => setShowReminder(false), 30000)
      }
    }

    // Check every 30 seconds
    const id = setInterval(check, 30000)
    // Check immediately
    check()

    return () => clearInterval(id)
  }, [])

  const dismiss = () => setShowReminder(false)

  return { showReminder, dismiss }
}
