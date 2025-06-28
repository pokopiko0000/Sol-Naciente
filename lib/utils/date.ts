export function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short'
  })
}

export function isEntryTime(): boolean {
  const now = new Date()
  const day = now.getDate()
  const hour = now.getHours()
  const minute = now.getMinutes()
  
  return (day === 1 || day === 10) && hour === 22 && minute < 30
}

export function isEntryDay(): boolean {
  const now = new Date()
  const day = now.getDate()
  
  return day === 1 || day === 10
}