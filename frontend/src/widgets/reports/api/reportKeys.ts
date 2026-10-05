export const reportKeys = {
  all: ['reports'] as const,
  examinations: () => [...reportKeys.all, 'examinations'] as const,
  deletedPatients: () => [...reportKeys.all, 'deleted-patients'] as const,
}
