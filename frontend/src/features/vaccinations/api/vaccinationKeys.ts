export const vaccinationKeys = {
  all: ['vaccinations'] as const,
  patient: (patientId: string) => [...vaccinationKeys.all, 'patient', patientId] as const,
  reminders: (patientId: string) => [...vaccinationKeys.all, 'reminders', patientId] as const,
  due: (until: string) => [...vaccinationKeys.all, 'due', until] as const,
  certificates: (patientId: string) => [...vaccinationKeys.all, 'certificates', patientId] as const,
  lastIssuer: () => [...vaccinationKeys.all, 'last-issuer'] as const,
}
