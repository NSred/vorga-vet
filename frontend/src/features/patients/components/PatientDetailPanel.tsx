import type { ReactNode } from 'react'
import {
  Badge,
  Button,
  DetailSection,
  EntityHeader,
  Field,
  FieldGrid,
  SlidePanel,
} from '@/shared/ui'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import { calculateAge } from '../lib/patientAge'
import type { PatientDetail } from '../types'
import { SPECIES_EMOJI, SPECIES_LABELS } from '@/shared/domain/species'
import styles from './PatientDetailPanel.module.css'

function Tile({ label, value, unit }: { label: string; value?: string | number; unit?: string }) {
  const blank = value === undefined || value === ''
  return (
    <div className={styles.tile}>
      <span className={styles.tileLabel}>{label}</span>
      <span className={styles.tileValue}>
        {blank ? '—' : value}
        {!blank && unit && <span className={styles.unit}> {unit}</span>}
      </span>
    </div>
  )
}

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
        <EntityHeader
          eyebrow={patient.cardNumber}
          avatar={SPECIES_EMOJI[patient.species]}
          title={patient.name}
          subtitle={`${patient.breedName} · ${age ?? '—'} yrs`}
          chips={
            <>
              {patient.isDeleted ? (
                <Badge tone="danger">Deleted</Badge>
              ) : (
                <Badge tone="accent">● Active</Badge>
              )}
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
        <div className={styles.tiles}>
          <Tile label="Age" value={age} unit="yrs" />
          <Tile label="Weight" value={patient.weightKg} unit="kg" />
          <Tile label="Sex" value={patient.sex === 'female' ? 'Female' : 'Male'} />
        </div>
        <FieldGrid>
          <Field label="Species" value={SPECIES_LABELS[patient.species]} />
          <Field label="Breed" value={patient.breedName} />
          <Field label="Color" value={patient.color} />
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
