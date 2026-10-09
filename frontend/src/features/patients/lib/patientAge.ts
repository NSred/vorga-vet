import { formatDateOnly, parseDateOnly } from '@/shared/lib/dateOnly'

const DAY_MS = 24 * 60 * 60 * 1000

function wholeMonthsBetween(birth: Date, today: Date): number {
  const months =
    (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth())
  return today.getDate() < birth.getDate() ? months - 1 : months
}

function wholeDaysBetween(birth: Date, today: Date): number {
  const start = Date.UTC(birth.getFullYear(), birth.getMonth(), birth.getDate())
  const end = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((end - start) / DAY_MS)
}

export function formatAge(birthDate?: string, today: Date = new Date()): string | undefined {
  if (!birthDate) return undefined

  const birth = parseDateOnly(birthDate)
  const days = wholeDaysBetween(birth, today)
  if (days < 0) return undefined

  const months = wholeMonthsBetween(birth, today)

  if (months >= 12) {
    const years = Math.floor(months / 12)
    const rest = months % 12
    const yearsLabel = `${years} ${years === 1 ? 'yr' : 'yrs'}`
    return rest > 0 ? `${yearsLabel} ${rest} mo` : yearsLabel
  }

  if (months >= 1) return `${months} mo`

  const weeks = Math.floor(days / 7)
  return weeks >= 1 ? `${weeks} wk` : '< 1 wk'
}

export function wholeYears(birthDate?: string, today: Date = new Date()): number | undefined {
  if (!birthDate) return undefined

  const months = wholeMonthsBetween(parseDateOnly(birthDate), today)
  return months < 0 ? undefined : Math.floor(months / 12)
}

export function birthDateForAge(years: number, today: Date = new Date()): string {
  const year = today.getFullYear() - years
  const candidate = new Date(year, today.getMonth(), today.getDate())
  const date =
    candidate.getMonth() === today.getMonth() ? candidate : new Date(year, today.getMonth() + 1, 0)
  return formatDateOnly(date)
}
