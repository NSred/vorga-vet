import type { DateRange } from '@/shared/lib/clinicTime'

export const appointmentKeys = {
  all: ['appointments'] as const,
  list: (range: DateRange) => [...appointmentKeys.all, 'list', range.from, range.to] as const,
  availability: (range: DateRange) =>
    [...appointmentKeys.all, 'availability', range.from, range.to] as const,
}
