import { Badge, Skeleton } from '@/shared/ui'
import { usePatientQuery } from '../hooks/usePatientQuery'
import { calculateAge } from '../lib/patientAge'
import styles from './PatientSummary.module.css'

export interface PatientSummaryProps {
  patientId: string
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldValue}>{value}</span>
    </div>
  )
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
    <div className={styles.grid}>
      <Field label="Record no." value={data.cardNumber} />
      <Field label="Name" value={data.name} />
      <Field label="Breed" value={data.breedName} />
      <Field label="Age" value={age === undefined ? '—' : String(age)} />
      <Field label="Owner" value={data.ownerName} />
      <Field label="Phone" value={data.phoneNumber} />
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Allergies</span>
        <span className={styles.fieldValue}>
          {data.allergies.length === 0
            ? '—'
            : data.allergies.map((allergen) => (
                <Badge key={allergen.id} tone="warn">
                  {allergen.name}
                </Badge>
              ))}
        </span>
      </div>
    </div>
  )
}
