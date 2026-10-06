import type { ReactNode } from 'react'
import { Badge, Button, DetailSection, Field, FieldGrid, SlidePanel } from '@/shared/ui'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import { calculateAge } from '../lib/patientAge'
import type { PatientDetail } from '../types'
import { SPECIES_EMOJI } from '@/shared/domain/species'
import styles from './PatientDetailPanel.module.css'

export interface PatientDetailPanelProps {
  patient: PatientDetail
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: () => void
  onDelete?: () => void
  visitsSection?: ReactNode
  vaccinationsSection?: ReactNode
  remindersSection?: ReactNode
  microchipSection?: ReactNode
}

export function PatientDetailPanel({
  patient,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  visitsSection,
  vaccinationsSection,
  remindersSection,
  microchipSection,
}: PatientDetailPanelProps) {
  const age = calculateAge(patient.birthDate)

  return (
    <SlidePanel
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel={`Record for ${patient.name}`}
      headerTone="accent"
      header={
        <div className={styles.header}>
          <span className={styles.avatar}>{SPECIES_EMOJI[patient.species]}</span>
          <div>
            <div className={styles.name}>{patient.name}</div>
            <div className={styles.subtitle}>
              {patient.breedName} · {age ?? '—'} yrs
            </div>
          </div>
        </div>
      }
      footer={
        onDelete || onEdit ? (
          <>
            {onDelete && (
              <Button variant="danger" type="button" onClick={onDelete}>
                Delete
              </Button>
            )}
            {onEdit && (
              <Button variant="outline" type="button" onClick={onEdit}>
                ✎ Edit
              </Button>
            )}
          </>
        ) : undefined
      }
    >
      <DetailSection title="Basic information">
        <FieldGrid>
          <Field label="Record no." value={patient.cardNumber} />
          <Field label="Species" value={patient.species} />
          <Field label="Breed" value={patient.breedName} />
          <Field label="Sex" value={patient.sex === 'female' ? 'Female' : 'Male'} />
          <Field label="Age" value={age} />
          <Field label="Weight" value={patient.weightKg} />
          <Field label="Color" value={patient.color} />
          <Field label="Chip no." value={patient.chipNumber} />
          <Field label="Record status" value={patient.isDeleted ? 'Deleted' : 'Active'} />
        </FieldGrid>
      </DetailSection>

      <DetailSection title="Medical records">
        <Field
          label="Allergies"
          value={patient.allergies.map((allergen) => (
            <Badge key={allergen.id} tone="warn">
              {allergen.name}
            </Badge>
          ))}
        />
        <Field label="Medical history" value={patient.anamnesis} />
        <Field label="Note" value={patient.note} />
      </DetailSection>

      <DetailSection title="Owner contact">
        <FieldGrid>
          <Field label="Owner" value={patient.ownerName} />
          <Field label="Phone" value={patient.phoneNumber} />
          <Field label="Address" value={patient.address} />
          <Field label="City" value={patient.city} />
          <Field label="Created" value={formatDisplayDate(patient.createdAt)} />
        </FieldGrid>
      </DetailSection>

      {vaccinationsSection && (
        <DetailSection title="Vaccinations">{vaccinationsSection}</DetailSection>
      )}
      {microchipSection && <DetailSection title="Microchip">{microchipSection}</DetailSection>}
      {remindersSection && <DetailSection title="Reminders">{remindersSection}</DetailSection>}
      {visitsSection && <DetailSection title="Visits">{visitsSection}</DetailSection>}
    </SlidePanel>
  )
}
