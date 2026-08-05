import { Badge, Button, SlidePanel } from '@/shared/ui'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import type { Patient } from '../types'
import { SPECIES_EMOJI } from '../lib/speciesEmoji'
import styles from './PatientDetailPanel.module.css'

export interface PatientDetailPanelProps {
  patient: Patient
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
  const balance = (patient.totalServicesRsd ?? 0) - (patient.paidRsd ?? 0)

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
              {patient.breed} · {formatValue(patient.age)} yrs
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
          <Field label="Breed" value={patient.breed} />
          <Field label="Sex" value={patient.sex === 'female' ? 'Female' : 'Male'} />
          <Field label="Age" value={patient.age} />
          <Field label="Weight" value={patient.weightKg} />
          <Field label="Color" value={patient.color} />
          <Field label="Chip no." value={patient.chipNumber} />
          <Field label="Record status" value={patient.cardStatus === 'active' ? 'Active' : 'Deleted'} />
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Medical records</h3>
        <div className={styles.grid}>
          <Field label="Allergies" value={patient.allergies} />
        </div>
        <Field label="Medical history" value={patient.anamnesis} />
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Owner contact</h3>
        <div className={styles.grid}>
          <Field label="Owner" value={patient.ownerName} />
          <Field label="Phone" value={patient.phone} />
          <Field label="Mobile" value={patient.mobile} />
          <Field label="Address" value={patient.address} />
          <Field label="City" value={patient.city} />
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Finances</h3>
        <div className={styles.grid}>
          <Field label="Total services" value={patient.totalServicesRsd ? `${patient.totalServicesRsd} RSD` : undefined} />
          <Field label="Paid" value={patient.paidRsd ? `${patient.paidRsd} RSD` : undefined} />
          <Field label="Balance" value={balance <= 0 ? 'Settled' : `${balance} RSD`} />
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Visit history ({patient.visits.length})</h3>
        {patient.visits.length === 0 ? (
          <p className={styles.emptyVisits}>No visits on record.</p>
        ) : (
          <ul className={styles.visitList}>
            {patient.visits.map((visit) => (
              <li key={visit.id} className={styles.visitCard}>
                <div className={styles.visitHeader}>
                  <Badge tone="ok">{visit.type}</Badge>
                  <span className={styles.visitDate}>{formatDisplayDate(visit.date)}</span>
                </div>
                <div className={styles.visitTitle}>{visit.title}</div>
                {visit.description && <div className={styles.visitDescription}>{visit.description}</div>}
                {visit.costRsd !== undefined && <div className={styles.visitCost}>💰 {visit.costRsd} RSD</div>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </SlidePanel>
  )
}
