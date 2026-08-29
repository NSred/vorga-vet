import { Badge, Button, SlidePanel } from '@/shared/ui'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import { calculateAge } from '../lib/patientAge'
import type { PatientDetail } from '../types'
import { SPECIES_EMOJI } from '@/shared/domain/species'
import styles from './PatientDetailPanel.module.css'

export interface PatientDetailPanelProps {
  patient: PatientDetail
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: () => void
  onDelete: () => void
}

function formatValue(value: string | number | undefined): string {
  if (value === undefined || value === '' || (typeof value === 'number' && Number.isNaN(value))) {
    return '—'
  }
  return String(value)
}

function Field({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldValue}>{formatValue(value)}</span>
    </div>
  )
}

export function PatientDetailPanel({ patient, open, onOpenChange, onEdit, onDelete }: PatientDetailPanelProps) {
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
              {patient.breedName} · {formatValue(age)} yrs
            </div>
          </div>
        </div>
      }
      footer={
        <>
          <Button variant="danger" type="button" onClick={onDelete}>
            Delete
          </Button>
          <Button variant="outline" type="button" onClick={onEdit}>
            ✎ Edit
          </Button>
          <Button variant="outline" type="button" disabled>
            🖨 Print
          </Button>
        </>
      }
    >
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Basic information</h3>
        <div className={styles.grid}>
          <Field label="Record no." value={patient.cardNumber} />
          <Field label="Species" value={patient.species} />
          <Field label="Breed" value={patient.breedName} />
          <Field label="Sex" value={patient.sex === 'female' ? 'Female' : 'Male'} />
          <Field label="Age" value={age} />
          <Field label="Weight" value={patient.weightKg} />
          <Field label="Color" value={patient.color} />
          <Field label="Chip no." value={patient.chipNumber} />
          <Field label="Record status" value={patient.isDeleted ? 'Deleted' : 'Active'} />
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Medical records</h3>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Allergies</span>
          <span className={styles.fieldValue}>
            {patient.allergies.length === 0
              ? '—'
              : patient.allergies.map((allergen) => (
                  <Badge key={allergen.id} tone="warn">
                    {allergen.name}
                  </Badge>
                ))}
          </span>
        </div>
        <Field label="Medical history" value={patient.anamnesis} />
        <Field label="Note" value={patient.note} />
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Owner contact</h3>
        <div className={styles.grid}>
          <Field label="Owner" value={patient.ownerName} />
          <Field label="Phone" value={patient.phoneNumber} />
          <Field label="Address" value={patient.address} />
          <Field label="City" value={patient.city} />
          <Field label="Created" value={formatDisplayDate(patient.createdAt)} />
        </div>
      </section>
    </SlidePanel>
  )
}
