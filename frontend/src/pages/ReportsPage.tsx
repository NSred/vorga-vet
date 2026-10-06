import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Button, layout, PageHeader, PrintIcon, SegmentedControl } from '@/shared/ui'
import { clinicToday } from '@/shared/lib/clinicTime'
import { oneOf } from '@/shared/lib/listParams'
import { DailyReport, DeletedCards, type ReportView, UnpaidExams } from '@/widgets/reports'
import styles from './ReportsPage.module.css'

const VIEW_OPTIONS: { value: ReportView; label: string }[] = [
  { value: 'daily', label: 'Daily report' },
  { value: 'unpaid', label: 'Unpaid exams' },
  { value: 'deleted', label: 'Deleted cards' },
]
const DEFAULT_VIEW: ReportView = 'daily'
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const VIEWS = VIEW_OPTIONS.map((option) => option.value)
function dayOf(value: string | null): string {
  return value !== null && DAY_PATTERN.test(value) ? value : clinicToday()
}

export function ReportsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [printing, setPrinting] = useState(false)
  const view = oneOf(searchParams.get('view'), VIEWS) ?? DEFAULT_VIEW
  const day = dayOf(searchParams.get('day'))

  const update = (nextView: ReportView, nextDay: string) => {
    const params: Record<string, string> = {}
    if (nextView !== DEFAULT_VIEW) params.view = nextView
    if (nextView === 'daily' && nextDay !== clinicToday()) params.day = nextDay
    setPrinting(false)
    setSearchParams(params, { replace: true })
  }

  const openPatient = (patientId: string) => navigate(`/patients?patient=${patientId}`)
  const print = { printing, onPrinted: () => setPrinting(false) }

  return (
    <div className={layout.page}>
      <PageHeader
        title="Reports"
        subtitle="The day's exams and takings, what is still unpaid, and deleted patient cards."
        actions={
          <Button
            variant="outline"
            type="button"
            className={styles.printButton}
            disabled={printing}
            onClick={() => setPrinting(true)}
          >
            <PrintIcon />
            Print
          </Button>
        }
      />

      <SegmentedControl
        value={view}
        onChange={(next) => update(next, day)}
        options={VIEW_OPTIONS}
      />

      {view === 'daily' && (
        <DailyReport
          day={day}
          onDayChange={(next) => update('daily', next)}
          onOpenPatient={openPatient}
          {...print}
        />
      )}
      {view === 'unpaid' && <UnpaidExams onOpenPatient={openPatient} {...print} />}
      {view === 'deleted' && <DeletedCards {...print} />}
    </div>
  )
}
