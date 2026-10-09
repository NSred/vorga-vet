import type { ReactNode } from 'react'
import { SPECIES_EMOJI } from '@/shared/domain/species'
import { telHref } from '@/shared/lib/phone'
import { Badge, EntityHeader } from '@/shared/ui'
import { formatAge } from '../lib/patientAge'
import type { PatientDetail } from '../types'
import styles from './PatientHeader.module.css'

export interface PatientHeaderProps {
  patient: PatientDetail
  eyebrow?: ReactNode
  showStatus?: boolean
  footnote?: ReactNode
}

export function PatientHeader({
  patient,
  eyebrow,
  showStatus = false,
  footnote,
}: PatientHeaderProps) {
  const age = formatAge(patient.birthDate)

  return (
    <>
      <EntityHeader
        eyebrow={eyebrow}
        avatar={SPECIES_EMOJI[patient.species]}
        title={patient.name}
        subtitle={
          <>
            <span className={styles.subtitleLine}>
              {patient.breedName} · {age ?? '—'}
            </span>
            <span className={styles.ownerLine}>
              <span className={styles.owner}>{patient.ownerName}</span>
              {patient.phoneNumber && (
                <a
                  className={styles.phone}
                  href={telHref(patient.phoneNumber)}
                  aria-label={`Call ${patient.ownerName}, ${patient.phoneNumber}`}
                >
                  {patient.phoneNumber}
                </a>
              )}
            </span>
          </>
        }
        chips={
          <>
            {showStatus &&
              (patient.isDeleted ? (
                <Badge tone="danger">Deleted</Badge>
              ) : (
                <Badge tone="accent">● Active</Badge>
              ))}
            <Badge tone={patient.sex === 'female' ? 'female' : 'male'}>
              {patient.sex === 'female' ? '♀ Female' : '♂ Male'}
            </Badge>
            {patient.allergies.map((allergen) => (
              <Badge key={allergen.id} tone="warn">
                ⚠ {allergen.name}
              </Badge>
            ))}
          </>
        }
      />
      {footnote && <p className={styles.footnote}>{footnote}</p>}
    </>
  )
}
