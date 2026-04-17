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
    await api.saveEntry(entry)
    api.addRecentActivity(activity)
    await load()
    return entry
  }, [load])

  const updateEntry = useCallback(async (entry: TimeEntry) => {
    await api.saveEntry(entry)
    if (entry.activity) api.addRecentActivity(entry.activity)
    await load()
  }, [load])

  const removeEntry = useCallback(async (id: string) => {
    await api.deleteEntry(id)
    await load()
  }, [load])

  const getEntryForSlot = useCallback((slotTime: string) => {
    return entries.find(e => e.startTime === slotTime) || null
  }, [entries])

  return { entries, loading, addEntry, updateEntry, removeEntry, getEntryForSlot, reload: load }
}
