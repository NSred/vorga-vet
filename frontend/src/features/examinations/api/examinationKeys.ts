export const examinationKeys = {
  all: ['examinations'] as const,
  forPatient: (patientId: string) => [...examinationKeys.all, 'patient', patientId] as const,
  attachment: (attachmentId: string) =>
    [...examinationKeys.all, 'attachment', attachmentId] as const,
}
