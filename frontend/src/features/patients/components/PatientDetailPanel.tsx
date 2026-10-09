import type { ReactNode } from 'react'
import {
  Badge,
  Button,
  DetailSection,
  Field,
  FieldGrid,
  SlidePanel,
  Tile,
} from '@/shared/ui'
import { coatColorOf } from '@/shared/domain/coatColors'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import { formatAge } from '../lib/patientAge'
import type { PatientDetail } from '../types'
import { SPECIES_LABELS, SPECIES_TINT } from '@/shared/domain/species'
import { PatientHeader } from './PatientHeader'
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
  const age = formatAge(patient.birthDate)
  const coat = coatColorOf(patient.color)

  return (
    <SlidePanel
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel={`Record for ${patient.name}`}
      headerTone="accent"
      headerTint={SPECIES_TINT[patient.species]}
      header={<PatientHeader patient={patient} eyebrow={patient.cardNumber} showStatus />}
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
        <div className={styles.tiles}>
          <Tile label="Age" value={age} />
          <Tile label="Weight" value={patient.weightKg} unit="kg" />
          <Tile label="Sex" value={patient.sex === 'female' ? 'Female' : 'Male'} />
        </div>
        <FieldGrid>
          <Field label="Species" value={SPECIES_LABELS[patient.species]} />
          <Field label="Breed" value={patient.breedName} />
          <Field
            label="Color"
            value={
              patient.color && (
                <span className={styles.coat}>
                  {coat && (
                    <span
                      className={styles.coatSwatch}
                      style={{ background: coat.swatch }}
                      aria-hidden="true"
                    />
                  )}
                  {patient.color}
                </span>
              )
            }
          />
          <Field label="Chip no." value={patient.chipNumber} />
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

      {vaccinationsSection}
      {microchipSection}
      {remindersSection}
      {visitsSection}
    </SlidePanel>
  )
}
