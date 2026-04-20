import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { TimeEntry, EnergyType, CostType } from '../types'
import * as api from '../api'

export function useEntries(date?: string) {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const data = date ? await api.fetchEntries(date) : await api.fetchAllEntries()
    setEntries(data)
    setLoading(false)
  }, [date])

  useEffect(() => { load() }, [load])

  const addEntry = useCallback(async (
    date: string,
    startTime: string,
    activity: string,
    energy: EnergyType = null,
    delegationCost: CostType = null,
  ) => {
    const entry: TimeEntry = {
      id: uuidv4(),
      date,
      startTime,
      activity,
      energy,
      delegationCost,
      createdAt: new Date().toISOString(),
    }
    // 立刻更新畫面
    setEntries(prev => [...prev, entry])
    api.addRecentActivity(activity)
    // 背景存到 Google Sheet
    api.saveEntry(entry)
    return entry
  }, [])

  const updateEntry = useCallback(async (entry: TimeEntry) => {
    // 立刻更新畫面
    setEntries(prev => prev.map(e => e.id === entry.id ? entry : e))
    if (entry.activity) api.addRecentActivity(entry.activity)
    api.saveEntry(entry)
  }, [])

  const removeEntry = useCallback(async (id: string) => {
    // 立刻更新畫面
    setEntries(prev => prev.filter(e => e.id !== id))
    api.deleteEntry(id)
  }, [])

  const getEntryForSlot = useCallback((slotTime: string) => {
    return entries.find(e => e.startTime === slotTime) || null
  }, [entries])

  return { entries, loading, addEntry, updateEntry, removeEntry, getEntryForSlot, reload: load }
}
