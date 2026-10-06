import type { PatientDetail } from '@/features/patients'
import type { CertificateSubject } from '@/features/vaccinations'

export function certificateSubjectOf(patient: PatientDetail): CertificateSubject {
  return {
    animal: {
      name: patient.name,
      species: patient.species,
      breed: patient.breedName,
      sex: patient.sex,
      birthDate: patient.birthDate,
      color: patient.color,
      chipNumber: patient.chipNumber,
    },
    owner: {
      name: patient.ownerName,
      address: patient.address,
      city: patient.city,
      phone: patient.phoneNumber,
    },
  }
}
