import type { DateRange } from '@/shared/lib/clinicTime'

const DEFAULT_SLOT_MINUTES = 30

export const appointmentKeys = {
  all: ['appointments'] as const,
  list: (range: DateRange) => [...appointmentKeys.all, 'list', range.from, range.to] as const,
  detail: (id: string) => [...appointmentKeys.all, 'detail', id] as const,
  unresolved: () => [...appointmentKeys.all, 'unresolved'] as const,
  availability: (range: DateRange, durationMinutes = DEFAULT_SLOT_MINUTES) =>
    [...appointmentKeys.all, 'availability', range.from, range.to, durationMinutes] as const,
}
