import type { TimeEntry } from './types'

const SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string || ''

async function request(action: string, data?: Record<string, unknown>): Promise<unknown> {
  if (!SCRIPT_URL) {
    console.warn('Apps Script URL not set. Using localStorage fallback.')
    return null
  }

  if (!data) {
    const url = `${SCRIPT_URL}?action=${action}`
    const res = await fetch(url, { redirect: 'follow' })
    return res.json()
  }

  const res = await fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, ...data }),
    redirect: 'follow',
  })
  return res.json()
}

// --- localStorage fallback (works without Apps Script) ---

function getLocalEntries(): TimeEntry[] {
  const raw = localStorage.getItem('buyback-entries')
  return raw ? JSON.parse(raw) : []
}

function setLocalEntries(entries: TimeEntry[]) {
  localStorage.setItem('buyback-entries', JSON.stringify(entries))
}

// --- Public API ---

export async function fetchEntries(date?: string): Promise<TimeEntry[]> {
  if (!SCRIPT_URL) {
    const all = getLocalEntries()
    return date ? all.filter(e => e.date === date) : all
  }
  const result = await request('getEntries', date ? { date } : undefined)
  return (result as { entries: TimeEntry[] })?.entries ?? []
}

export async function fetchAllEntries(): Promise<TimeEntry[]> {
  if (!SCRIPT_URL) return getLocalEntries()
  const result = await request('getAllEntries')
  return (result as { entries: TimeEntry[] })?.entries ?? []
}

export async function saveEntry(entry: TimeEntry): Promise<void> {
  if (!SCRIPT_URL) {
    const entries = getLocalEntries()
    const idx = entries.findIndex(e => e.id === entry.id)
    if (idx >= 0) entries[idx] = entry
    else entries.push(entry)
    setLocalEntries(entries)
    return
  }
  await request('saveEntry', { entry: entry as unknown as Record<string, unknown> })
}

export async function deleteEntry(id: string): Promise<void> {
  if (!SCRIPT_URL) {
    setLocalEntries(getLocalEntries().filter(e => e.id !== id))
    return
  }
  await request('deleteEntry', { id })
}

// --- Recent activities ---

export function getRecentActivities(): string[] {
  const raw = localStorage.getItem('buyback-recent-activities')
  return raw ? JSON.parse(raw) : []
}

export function addRecentActivity(activity: string) {
  const recent = getRecentActivities().filter(a => a !== activity)
  recent.unshift(activity)
  localStorage.setItem('buyback-recent-activities', JSON.stringify(recent.slice(0, 20)))
}

// --- Config ---

export function getStartDate(): string {
  return localStorage.getItem('buyback-start-date') || ''
}

export function setStartDate(date: string) {
  localStorage.setItem('buyback-start-date', date)
}
