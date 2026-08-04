export function parseDateOnly(dateIso: string): Date {
  const [year, month, day] = dateIso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatDateOnly(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayIso(): string {
  return formatDateOnly(new Date())
}

export function formatDisplayDate(dateIso: string): string {
  const [year, month, day] = dateIso.split('-')
  return `${day}.${month}.${year}`
}
