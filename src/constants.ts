// Tracking day: 09:30 → 01:00 next day (skip 01:30-09:30 sleep)
// 30-minute intervals
// Each slot records what happened in the PREVIOUS 30 minutes

export const SLOT_DURATION_MIN = 30

// Slots for a tracking day: 09:30, 10:00, 10:30 ... 23:30, 00:00, 00:30, 01:00
// 09:30 to 23:30 = 29 slots, 00:00 to 01:00 = 3 slots = 32 total
export const DAY_SLOTS: string[] = (() => {
  const slots: string[] = []
  // 09:30 to 23:30
  for (let h = 9; h <= 23; h++) {
    if (h === 9) {
      slots.push('09:30')
    } else {
      slots.push(`${String(h).padStart(2, '0')}:00`)
      slots.push(`${String(h).padStart(2, '0')}:30`)
    }
  }
  // 00:00 to 01:00
  slots.push('00:00')
  slots.push('00:30')
  slots.push('01:00')
  return slots
})()

export const AUDIT_DAYS = 14

/** Get the "previous slot" to record right now */
export function getCurrentSlot(): { date: string; startTime: string; endTime: string } {
  const now = new Date()
  const h = now.getHours()
  const m = now.getMinutes()

  // Floor to nearest 30 min
  const flooredM = m >= 30 ? 30 : 0
  // The slot we want to record is 30 min BEFORE the floored time
  const slotEnd = new Date(now)
  slotEnd.setMinutes(flooredM, 0, 0)

  const slotStart = new Date(slotEnd.getTime() - SLOT_DURATION_MIN * 60 * 1000)

  // Determine tracking day:
  // If current time is between 00:00-01:30, this belongs to yesterday's tracking day
  const trackingDate = new Date(now)
  if (h < 2 || (h === 1 && m <= 30)) {
    trackingDate.setDate(trackingDate.getDate() - 1)
  }

  return {
    date: formatDate(trackingDate),
    startTime: formatTime(slotStart),
    endTime: formatTime(slotEnd),
  }
}

export function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function getSlotEndTime(startTime: string): string {
  const [h, m] = startTime.split(':').map(Number)
  const d = new Date(2000, 0, 1, h, m + SLOT_DURATION_MIN)
  return formatTime(d)
}

export function isInActiveHours(): boolean {
  const now = new Date()
  const h = now.getHours()
  const m = now.getMinutes()
  const totalMin = h * 60 + m
  // Active: 09:30 (570) to 01:30 (90 next day)
  // So NOT active: 01:30 (90) to 09:30 (570)
  return totalMin >= 570 || totalMin < 90
}

export function getTrackingDayLabel(dateStr: string, startDate: string): string {
  const d = new Date(dateStr)
  const s = new Date(startDate)
  const diff = Math.floor((d.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  const month = d.getMonth() + 1
  const day = d.getDate()
  return `${month}/${day}（${weekday}）第 ${diff + 1} 天`
}
