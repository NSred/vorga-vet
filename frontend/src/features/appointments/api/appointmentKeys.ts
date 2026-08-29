export const appointmentKeys = {
  all: ['appointments'] as const,
  list: () => [...appointmentKeys.all, 'list'] as const,
}
