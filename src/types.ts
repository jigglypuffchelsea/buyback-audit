export interface TimeEntry {
  id: string
  date: string        // YYYY-MM-DD (tracking day, not calendar day)
  startTime: string   // HH:mm (slot start)
  activity: string
  energy: 'green' | 'red' | null
  delegationCost: 1 | 2 | 3 | 4 | null
  createdAt: string   // ISO timestamp
}

export type EnergyType = 'green' | 'red' | null
export type CostType = 1 | 2 | 3 | 4 | null
