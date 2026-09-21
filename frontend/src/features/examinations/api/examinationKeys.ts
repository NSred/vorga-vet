export const examinationKeys = {
  all: ['examinations'] as const,
  detail: (id: string) => [...examinationKeys.all, 'detail', id] as const,
  forPatient: (patientId: string) => [...examinationKeys.all, 'patient', patientId] as const,
}
