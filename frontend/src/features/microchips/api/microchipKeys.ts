export const microchipKeys = {
  all: ['microchips'] as const,
  patient: (patientId: string) => [...microchipKeys.all, 'patient', patientId] as const,
  lastClinic: () => [...microchipKeys.all, 'last-clinic'] as const,
}
