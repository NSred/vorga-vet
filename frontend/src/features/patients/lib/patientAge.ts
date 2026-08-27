import { parseDateOnly } from '@/shared/lib/dateOnly'

export function calculateAge(birthDate?: string): number | undefined {
  if (!birthDate) return undefined

  const birth = parseDateOnly(birthDate)
  const today = new Date()

  let age = today.getFullYear() - birth.getFullYear()
  const monthDelta = today.getMonth() - birth.getMonth()

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) {
    age -= 1
  }

  return age
}
