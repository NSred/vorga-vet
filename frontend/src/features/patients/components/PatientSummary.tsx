import { Badge, Field, FieldGrid, Skeleton } from '@/shared/ui'
import { usePatientQuery } from '../hooks/usePatientQuery'
import { calculateAge } from '../lib/patientAge'
import styles from './PatientSummary.module.css'

export interface PatientSummaryProps {
  patientId: string
}

export function PatientSummary({ patientId }: PatientSummaryProps) {
  const { data, isPending, isError } = usePatientQuery(patientId)

  if (isPending) {
    return <Skeleton height="6rem" />
  }

  if (isError || !data) {
    return <p className={styles.error}>Could not load the patient record.</p>
  }

  const age = calculateAge(data.birthDate)

  return (
    <FieldGrid>
      <Field label="Record no." value={data.cardNumber} />
      <Field label="Name" value={data.name} />
      <Field label="Breed" value={data.breedName} />
      <Field label="Age" value={age} />
      <Field label="Owner" value={data.ownerName} />
      <Field label="Phone" value={data.phoneNumber} />
      <Field
        label="Allergies"
        value={data.allergies.map((allergen) => (
          <Badge key={allergen.id} tone="warn">
            {allergen.name}
          </Badge>
        ))}
      />
    </FieldGrid>
  )
}
