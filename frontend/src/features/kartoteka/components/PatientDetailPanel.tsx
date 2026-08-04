import { Badge, Button, SlidePanel } from '@/shared/ui'
import type { Patient } from '../types'
import { SPECIES_EMOJI } from '../lib/speciesEmoji'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
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
      ariaLabel={`Karton pacijenta ${patient.name}`}
      headerTone="accent"
      header={
        <div className={styles.header}>
          <span className={styles.avatar}>{SPECIES_EMOJI[patient.species]}</span>
          <div>
            <div className={styles.name}>{patient.name}</div>
            <div className={styles.subtitle}>
              {patient.breed} · {formatValue(patient.age)} god.
            </div>
          </div>
        </div>
      }
      footer={
        <>
          <Button variant="danger" type="button" onClick={onDelete}>
            Obriši
          </Button>
          <Button variant="outline" type="button" onClick={onEdit}>
            ✎ Izmeni
          </Button>
          <Button variant="outline" type="button" disabled>
            🖨 Štampaj
          </Button>
        </>
      }
    >
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Osnovni podaci</h3>
        <div className={styles.grid}>
          <Field label="Broj kartona" value={patient.cardNumber} />
          <Field label="Vrsta" value={patient.species} />
          <Field label="Rasa" value={patient.breed} />
          <Field label="Pol" value={patient.sex === 'zenka' ? 'Ženka' : 'Mužjak'} />
          <Field label="Starost" value={patient.age} />
          <Field label="Težina" value={patient.weightKg} />
          <Field label="Boja" value={patient.color} />
          <Field label="Čip br." value={patient.chipNumber} />
          <Field label="Stanje kartona" value={patient.cardStatus === 'aktivan' ? 'Aktivan' : 'Obrisan'} />
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Medicinska evidencija</h3>
        <div className={styles.grid}>
          <Field label="Alergije" value={patient.allergies} />
        </div>
        <Field label="Anamneza" value={patient.anamnesis} />
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Kontakt vlasnika</h3>
        <div className={styles.grid}>
          <Field label="Vlasnik" value={patient.ownerName} />
          <Field label="Telefon" value={patient.phone} />
          <Field label="Mobilni" value={patient.mobile} />
          <Field label="Adresa" value={patient.address} />
          <Field label="Grad" value={patient.city} />
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Finansije</h3>
        <div className={styles.grid}>
          <Field label="Ukupno usluge" value={patient.totalServicesRsd ? `${patient.totalServicesRsd} RSD` : undefined} />
          <Field label="Plaćeno" value={patient.paidRsd ? `${patient.paidRsd} RSD` : undefined} />
          <Field label="Saldo" value={balance <= 0 ? 'Izmireno' : `${balance} RSD`} />
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Istorija pregleda ({patient.visits.length})</h3>
        {patient.visits.length === 0 ? (
          <p className={styles.emptyVisits}>Nema evidentiranih pregleda.</p>
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
