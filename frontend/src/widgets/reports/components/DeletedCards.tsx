import type { PatientListItem } from '@/features/patients'
import { speciesSr } from '@/shared/domain/printLabels'
import { SPECIES_LABELS } from '@/shared/domain/species'
import { telHref } from '@/shared/lib/phone'
import { EmptyState, PrintPortal, Skeleton, Table, type TableColumn } from '@/shared/ui'
import { useDeletedPatients } from '../hooks/useReportQueries'
import { ReportPrint } from './ReportPrint'
import styles from './Reports.module.css'

export interface DeletedCardsProps {
  printing: boolean
  onPrinted: () => void
}

const COLUMNS: TableColumn<PatientListItem>[] = [
  {
    key: 'patient',
    header: 'Patient',
    render: (patient) => (
      <span className={styles.stack}>
        <span className={styles.strong}>{patient.name}</span>
        <span className={styles.sub}>{patient.cardNumber}</span>
      </span>
    ),
  },
  {
    key: 'animal',
    header: 'Species & breed',
    render: (patient) => (
      <span className={styles.stack}>
        <span>{SPECIES_LABELS[patient.species]}</span>
        <span className={styles.sub}>{patient.breedName}</span>
      </span>
    ),
  },
  {
    key: 'owner',
    header: 'Owner',
    render: (patient) => (
      <span className={styles.stack}>
        <span>{patient.ownerName}</span>
        {patient.phoneNumber && (
          <a className={styles.phone} href={telHref(patient.phoneNumber)}>
            {patient.phoneNumber}
          </a>
        )}
      </span>
    ),
  },
]

export function DeletedCards({ printing, onPrinted }: DeletedCardsProps) {
  const { data, isPending, isError } = useDeletedPatients()
  const patients = data ?? []

  if (isPending) return <Skeleton height="10rem" />
  if (isError) return <p className={styles.mutedNote}>Could not load the deleted cards.</p>

  return (
    <section className={styles.view} aria-label="Deleted cards">
      <div className={styles.summaryCard} aria-label="Deleted totals">
        <div>
          <p className={styles.tileLabel}>Deleted cards</p>
          <p className={styles.tileValue}>{patients.length}</p>
        </div>
        <p className={styles.summaryNote}>By name · they cannot be restored yet</p>
      </div>

      {patients.length === 0 ? (
        <EmptyState message="No patient card has been deleted." />
      ) : (
        <div className={styles.tableCard}>
          <Table columns={COLUMNS} rows={patients} getRowId={(patient) => patient.id} />
        </div>
      )}

      {printing && (
        <PrintPortal onPrinted={onPrinted}>
          <ReportPrint
            title="Lista brisanih kartona"
            columns={[
              { label: 'Karton' },
              { label: 'Ime' },
              { label: 'Vrsta' },
              { label: 'Rasa' },
              { label: 'Vlasnik' },
              { label: 'Telefon' },
            ]}
            rows={patients.map((patient) => [
              patient.cardNumber,
              patient.name,
              speciesSr(patient.species),
              patient.breedName,
              patient.ownerName,
              patient.phoneNumber,
            ])}
            totals={[['Ukupno', String(patients.length)]]}
          />
        </PrintPortal>
      )}
    </section>
  )
}
