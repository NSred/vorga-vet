import { examinationErrorMessage } from '@/features/examinations'
import { clinicDateOf, clinicToday } from '@/shared/lib/clinicTime'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import { formatPrice } from '@/shared/lib/money'
import { telHref } from '@/shared/lib/phone'
import { plural } from '@/shared/lib/text'
import {
  Button,
  EmptyState,
  layout,
  PrintPortal,
  Skeleton,
  Table,
  type TableColumn,
  useToast,
} from '@/shared/ui'
import { usePayFromReport } from '../hooks/usePayFromReport'
import { useReportRows } from '../hooks/useReportQueries'
import { daysAgo } from '../lib/reportLabels'
import { unpaidRows, unpaidTotals } from '../lib/reportRows'
import type { ReportRow } from '../types'
import { Amount } from './Amount'
import { ReportPrint } from './ReportPrint'
import styles from './Reports.module.css'

export interface UnpaidExamsProps {
  onOpenPatient: (patientId: string) => void
  printing: boolean
  onPrinted: () => void
}

function dayOf(row: ReportRow): string {
  return clinicDateOf(row.examination.startedAt)
}

export function UnpaidExams({ onOpenPatient, printing, onPrinted }: UnpaidExamsProps) {
  const { showToast } = useToast()
  const today = clinicToday()
  const { data, isPending, isError } = useReportRows()
  const pay = usePayFromReport()
  const rows = unpaidRows(data ?? [])
  const totals = unpaidTotals(rows)

  const markPaid = (row: ReportRow) =>
    pay.mutate(row.examination.id, {
      onSuccess: () =>
        showToast({ tone: 'success', title: `${row.patient.name}'s exam marked as paid` }),
      onError: (error) =>
        showToast({
          tone: 'error',
          title: examinationErrorMessage(error, 'Could not mark the exam as paid.'),
        }),
    })

  const columns: TableColumn<ReportRow>[] = [
    {
      key: 'date',
      mobile: 'detail',
      header: 'Date',
      render: (row) => (
        <span className={styles.stack}>
          <span className={styles.strongNumeric}>{formatDisplayDate(dayOf(row))}</span>
          <span className={styles.sub}>{daysAgo(dayOf(row), today)}</span>
        </span>
      ),
    },
    {
      key: 'patient',
      mobile: 'title',
      header: 'Patient',
      render: (row) => (
        <span className={styles.stack}>
          <span className={styles.strong}>{row.patient.name}</span>
          <span className={styles.sub}>{row.patient.cardNumber}</span>
        </span>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      render: (row) => (
        <span className={styles.stack}>
          <span>{row.patient.ownerName}</span>
          {row.patient.phoneNumber && (
            <a
              className={styles.phone}
              href={telHref(row.patient.phoneNumber)}
              onClick={(event) => event.stopPropagation()}
            >
              {row.patient.phoneNumber}
            </a>
          )}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (row) => <Amount value={row.examination.cost ?? 0} />,
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (row) => (
        <Button
          variant="outline"
          type="button"
          className={styles.nowrap}
          aria-label={`Mark ${row.patient.name}'s exam of ${formatDisplayDate(dayOf(row))} as paid`}
          disabled={pay.isPending}
          onClick={(event) => {
            event.stopPropagation()
            markPaid(row)
          }}
        >
          Mark as paid
        </Button>
      ),
    },
  ]

  if (isPending) return <Skeleton height="10rem" />
  if (isError) return <p className={styles.mutedNote}>Could not load the unpaid exams.</p>

  return (
    <section className={layout.stack} aria-label="Unpaid exams">
      <div className={styles.summaryCard} aria-label="Unpaid totals">
        <div>
          <p className={`${styles.tileLabel} ${styles.toneWarn}`}>Outstanding</p>
          <p className={`${styles.tileValue} ${styles.toneWarn}`}>
            <Amount value={totals.owed} size="large" />
          </p>
        </div>
        <p className={styles.summaryNote}>
          {plural(totals.count, 'exam', 'exams')} · {plural(totals.owners, 'owner', 'owners')} ·
          oldest first
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState message="Every exam with a cost is paid." />
      ) : (
        <div className={styles.tableCard}>
          <Table
            columns={columns}
            rows={rows}
            getRowId={(row) => row.examination.id}
            onRowClick={(row) => onOpenPatient(row.patient.id)}
          />
        </div>
      )}

      {printing && (
        <PrintPortal onPrinted={onPrinted}>
          <ReportPrint
            title="Lista dužnika"
            columns={[
              { label: 'Datum' },
              { label: 'Karton' },
              { label: 'Pacijent' },
              { label: 'Vlasnik' },
              { label: 'Telefon' },
              { label: 'Iznos', numeric: true },
            ]}
            rows={rows.map((row) => [
              formatDisplayDate(dayOf(row)),
              row.patient.cardNumber,
              row.patient.name,
              row.patient.ownerName,
              row.patient.phoneNumber,
              formatPrice(row.examination.cost ?? 0),
            ])}
            totals={[
              ['Pregleda', String(totals.count)],
              ['Vlasnika', String(totals.owners)],
              ['Ukupno dugovanje', formatPrice(totals.owed)],
            ]}
          />
        </PrintPortal>
      )}
    </section>
  )
}
