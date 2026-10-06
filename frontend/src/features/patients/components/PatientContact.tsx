import { telHref } from '@/shared/lib/phone'
import { usePatientQuery } from '../hooks/usePatientQuery'
import styles from './PatientContact.module.css'

export interface PatientContactProps {
  patientId: string
}

export function PatientContact({ patientId }: PatientContactProps) {
  const { data: patient, isPending, isError } = usePatientQuery(patientId)

  if (isPending) return <span className={styles.muted}>Loading…</span>
  if (isError || !patient) return <span className={styles.muted}>Patient not found</span>

  return (
    <span className={styles.contact}>
      <span className={styles.avatar} aria-hidden="true">
        {patient.name.trim().charAt(0).toLocaleUpperCase()}
      </span>
      <span className={styles.lines}>
        <span className={styles.who}>
          <span className={styles.name}>{patient.name}</span>
          <span className={styles.owner}> · {patient.ownerName}</span>
        </span>
        {patient.phoneNumber && (
          <a
            className={styles.phone}
            href={telHref(patient.phoneNumber)}
            aria-label={`Call ${patient.ownerName}, ${patient.phoneNumber}`}
          >
            {patient.phoneNumber}
          </a>
        )}
        {patient.isDeleted && <span className={styles.muted}>Deleted record</span>}
      </span>
    </span>
  )
}
