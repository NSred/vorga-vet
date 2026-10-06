import { chargesText, useChargesForExaminations } from '@/features/priceList'
import { addClinicDays, clinicTimeOf, clinicToday } from '@/shared/lib/clinicTime'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import { formatPrice } from '@/shared/lib/money'
import {
  Badge,
  Button,
  DatePicker,
  EmptyState,
  layout,
  PrintPortal,
  Skeleton,
  Table,
  type TableColumn,
} from '@/shared/ui'
import { useReportRows } from '../hooks/useReportQueries'
import { dayWithWeekday } from '../lib/reportLabels'
import { dayRows, dayTotals, vetOf } from '../lib/reportRows'
import type { ReportRow } from '../types'
import { Amount } from './Amount'
import { ReportPrint } from './ReportPrint'
import styles from './Reports.module.css'
import { StatTile } from './StatTile'

export interface DailyReportProps {
  day: string
  onDayChange: (day: string) => void
  onOpenPatient: (patientId: string) => void
  printing: boolean
  onPrinted: () => void
}

export function DailyReport({
  day,
  onDayChange,
  onOpenPatient,
  printing,
  onPrinted,
}: DailyReportProps) {
  const today = clinicToday()
  const { data, isPending, isError } = useReportRows()
  const rows = dayRows(data ?? [], day)
  const charges = useChargesForExaminations(rows.map((row) => row.examination.id))
  const totals = dayTotals(rows)

  const servicesOf = (row: ReportRow) =>
    charges.isPending ? '…' : chargesText(charges.byExamination.get(row.examination.id) ?? [])

  const columns: TableColumn<ReportRow>[] = [
    {
      key: 'time',
      header: 'Time',
      render: (row) => (
        <span className={styles.strongNumeric}>{clinicTimeOf(row.examination.startedAt)}</span>
      ),
    },
    {
      key: 'patient',
      header: 'Patient',
      render: (row) => (
        <span className={styles.stack}>
          <span>
            <span className={styles.strong}>{row.patient.name}</span>
            <span className={styles.muted}> · {row.patient.ownerName}</span>
          </span>
          <span className={styles.sub}>{row.patient.cardNumber}</span>
        </span>
      ),
    },
    { key: 'vet', header: 'Vet', render: (row) => vetOf(row.examination) || '—' },
    {
      key: 'diagnosis',
      header: 'Diagnosis & services',
      render: (row) => (
        <span className={styles.stack}>
          <span className={styles.strong}>{row.examination.diagnosis || '—'}</span>
          {servicesOf(row) && <span className={styles.sub}>{servicesOf(row)}</span>}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (row) =>
        row.examination.cost === undefined ? '—' : <Amount value={row.examination.cost} />,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      render: (row) =>
        row.examination.isPaid ? <Badge tone="ok">Paid</Badge> : <Badge tone="warn">Unpaid</Badge>,
    },
  ]

  const body = () => {
    if (isPending) return <Skeleton height="10rem" />
    if (isError) return <p className={styles.mutedNote}>Could not load the report.</p>
    if (rows.length === 0) return <EmptyState message={`No exams on ${formatDisplayDate(day)}.`} />

    return (
      <div className={styles.tableCard}>
        <Table
          columns={columns}
          rows={rows}
          getRowId={(row) => row.examination.id}
          onRowClick={(row) => onOpenPatient(row.patient.id)}
        />
      </div>
    )
  }

  return (
    <section className={layout.stack} aria-label="Daily report">
      <div className={styles.dayNav}>
        <Button
          variant="outline"
          type="button"
          aria-label="Previous day"
          onClick={() => onDayChange(addClinicDays(day, -1))}
        >
          ‹
        </Button>
        <DatePicker
          id="report-day"
          label="Day"
          hideLabel
          className={styles.dayPicker}
          value={day}
          formatValue={dayWithWeekday}
          onChange={(next) => {
            if (next) onDayChange(next)
          }}
        />
        <Button
          variant="outline"
          type="button"
          aria-label="Next day"
          onClick={() => onDayChange(addClinicDays(day, 1))}
        >
          ›
        </Button>
        {day !== today && (
          <Button
            variant="outline"
            type="button"
            className={styles.nowrap}
            onClick={() => onDayChange(today)}
          >
            Today
          </Button>
        )}
      </div>

      {!isPending && !isError && (
        <dl className={styles.tiles} aria-label="Day totals">
          <StatTile label="Exams">{totals.count}</StatTile>
          <StatTile label="Total">
            <Amount value={totals.total} size="large" />
          </StatTile>
          <StatTile label="Paid" tone="ok">
            <Amount value={totals.paid} size="large" />
          </StatTile>
          <StatTile label="Unpaid" tone="warn">
            <Amount value={totals.open} size="large" />
          </StatTile>
        </dl>
      )}

      {body()}

      {printing && (
        <PrintPortal onPrinted={onPrinted}>
          <ReportPrint
            title={`Dnevni izveštaj za ${formatDisplayDate(day)}.`}
            columns={[
              { label: 'Vreme' },
              { label: 'Karton' },
              { label: 'Pacijent' },
              { label: 'Vlasnik' },
              { label: 'Veterinar' },
              { label: 'Dijagnoza' },
              { label: 'Usluge i lekovi' },
              { label: 'Iznos', numeric: true },
              { label: 'Plaćeno' },
            ]}
            rows={rows.map((row) => [
              clinicTimeOf(row.examination.startedAt),
              row.patient.cardNumber,
              row.patient.name,
              row.patient.ownerName,
              vetOf(row.examination) || '—',
              row.examination.diagnosis || '—',
              servicesOf(row) || '—',
              row.examination.cost === undefined ? '—' : formatPrice(row.examination.cost),
              row.examination.isPaid ? 'Da' : 'Ne',
            ])}
            totals={[
              ['Ukupno pregleda', String(totals.count)],
              ['Ukupno', formatPrice(totals.total)],
              ['Plaćeno', formatPrice(totals.paid)],
              ['Neplaćeno', formatPrice(totals.open)],
            ]}
          />
        </PrintPortal>
      )}
    </section>
  )
}
