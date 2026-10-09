export const examinationKeys = {
  all: ['examinations'] as const,
  patients: ['examinations', 'patient'] as const,
  forPatient: (patientId: string) => [...examinationKeys.patients, patientId] as const,
  attachment: (attachmentId: string) =>
    [...examinationKeys.all, 'attachment', attachmentId] as const,
}
