// Tracking day: 09:30 → 01:00 next day (skip 01:30-09:30 sleep)
// Interval: 30 or 60 minutes (user adjustable)
// Each slot records what happened in the PREVIOUS interval

export type IntervalType = 30 | 60

export function getInterval(): IntervalType {
  const val = localStorage.getItem('buyback-interval')
  return val === '60' ? 60 : 30
}

export function setInterval(interval: IntervalType) {
  localStorage.setItem('buyback-interval', String(interval))
}

export function getSlotDuration(): number {
  return getInterval()
}

export function generateDaySlots(interval: IntervalType = getInterval()): string[] {
  const slots: string[] = []
  const step = interval

  // 09:30 to 23:30+ (same day)
  for (let totalMin = 9 * 60 + 30; totalMin < 24 * 60; totalMin += step) {
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }

  // 00:00 to 01:00 (next day)
  for (let totalMin = 0; totalMin <= 60; totalMin += step) {
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }

  return slots
}

export const AUDIT_DAYS = 14

/** Get the "previous slot" to record right now */
export function getCurrentSlot(): { date: string; startTime: string; endTime: string } {
  const now = new Date()
  const h = now.getHours()
  const m = now.getMinutes()
  const interval = getInterval()

  // Floor to nearest interval
  const flooredM = Math.floor(m / interval) * interval
  const slotEnd = new Date(now)
  slotEnd.setMinutes(flooredM, 0, 0)

  const slotStart = new Date(slotEnd.getTime() - interval * 60 * 1000)

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
  const d = new Date(2000, 0, 1, h, m + getInterval())
  return formatTime(d)
}

export function isInActiveHours(): boolean {
  const now = new Date()
  const h = now.getHours()
  const m = now.getMinutes()
  const totalMin = h * 60 + m
  return totalMin >= 570 || totalMin < 90
}
