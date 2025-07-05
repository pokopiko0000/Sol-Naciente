export type DateEntry = {
  date: string
  performance_type: '漫才（漫談）' | 'コント' | '未定'
}

export type EntryForm = {
  indies_name: string
  entry_name: string
  entries: DateEntry[]
  remarks: string
  email: string
  lineUrl: string
}

export type Entry = {
  id: string
  indies_name: string
  entry_name: string
  performance_type: string
  target_date: string
  remarks: string | null
  email: string
  timestamp: string
}

export type Live = {
  id: string
  date: string
  capacity: number
  is_confirmed: boolean
  assignments: Array<{
    id: string
    order: number
    entry: Entry
  }>
}

export type Assignment = {
  id: string
  entryId: string
  liveId: string
  status: 'confirmed' | 'waiting'
  order: number
  entry?: Entry
  live?: Live
}

export type Settings = {
  id: string
  entry_start_time: string
  entry_end_time: string
  is_entry_active: boolean
  target_year: number
  target_month: number
}