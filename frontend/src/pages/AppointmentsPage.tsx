import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { EmptyState, useToast } from '@/shared/ui'
import {
  addClinicDays,
  addClinicMonths,
  addClinicWeeks,
  clinicDayRange,
  clinicMonthGridRange,
  clinicToday,
  clinicWeekRange,
} from '@/shared/lib/clinicTime'
import {
  AppointmentDetailPanel,
  CalendarToolbar,
  DayView,
  isVisible,
  MonthView,
  parseViewParams,
  toViewParams,
  useAppointmentsQuery,
  useAvailabilityQuery,
  WeekView,
} from '@/features/appointments'
import type { Appointment, AppointmentViewState, CalendarView } from '@/features/appointments'
import { PatientSummary } from '@/features/patients'
import styles from './AppointmentsPage.module.css'

export function AppointmentsPage() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selected, setSelected] = useState<Appointment | null>(null)

  const { view, date: currentDate, showCancelled } = parseViewParams(searchParams, clinicToday())

  const writeParams = useCallback(
    (next: Partial<AppointmentViewState>) => {
      const current = parseViewParams(searchParams, clinicToday())
      setSearchParams(toViewParams({ ...current, ...next }), { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const setView = (next: CalendarView) => writeParams({ view: next })
  const setCurrentDate = (next: string) => writeParams({ date: next })
  const setShowCancelled = (next: boolean) => writeParams({ showCancelled: next })

  const range = useMemo(() => {
    if (view === 'day') return clinicDayRange(currentDate)
    if (view === 'week') return clinicWeekRange(currentDate)
    return clinicMonthGridRange(currentDate)
  }, [view, currentDate])

  const appointmentsQuery = useAppointmentsQuery(range)
  const availabilityQuery = useAvailabilityQuery(range)

  const visible = useMemo(
    () => (appointmentsQuery.data ?? []).filter((item) => isVisible(item, showCancelled)),
    [appointmentsQuery.data, showCancelled],
  )

  const hasError = appointmentsQuery.isError || availabilityQuery.isError
  const isLoading = appointmentsQuery.isLoading || availabilityQuery.isLoading
  const slots = availabilityQuery.data ?? []
  const hasSlotData = availabilityQuery.isSuccess

  useEffect(() => {
    if (hasError) {
      showToast({ tone: 'error', title: 'Could not load appointments' })
    }
  }, [hasError, showToast])

  const handlePrev = () => {
    if (view === 'day') setCurrentDate(addClinicDays(currentDate, -1))
    else if (view === 'week') setCurrentDate(addClinicWeeks(currentDate, -1))
    else setCurrentDate(addClinicMonths(currentDate, -1))
  }

  const handleNext = () => {
    if (view === 'day') setCurrentDate(addClinicDays(currentDate, 1))
    else if (view === 'week') setCurrentDate(addClinicWeeks(currentDate, 1))
    else setCurrentDate(addClinicMonths(currentDate, 1))
  }

  const openDay = (dateIso: string) => {
    setCurrentDate(dateIso)
    setView('day')
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Appointments</h1>
          <p className={styles.subtitle}>Appointment calendar — day, week, and month view.</p>
        </div>
      </div>

      <CalendarToolbar
        view={view}
        onViewChange={setView}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={() => setCurrentDate(clinicToday())}
        showCancelled={showCancelled}
        onShowCancelledChange={setShowCancelled}
      />

      {hasError ? (
        <EmptyState message="Appointments could not be loaded." />
      ) : (
        <>
          {view === 'day' && (
            <DayView
              date={currentDate}
              slots={slots}
              appointments={visible}
              onAppointmentClick={setSelected}
              isLoading={isLoading}
              hasSlotData={hasSlotData}
            />
          )}
          {view === 'week' && (
            <WeekView
              date={currentDate}
              appointments={visible}
              slots={slots}
              onAppointmentClick={setSelected}
              onDateSelect={openDay}
              isLoading={isLoading}
              hasSlotData={hasSlotData}
            />
          )}
          {view === 'month' && (
            <MonthView
              date={currentDate}
              appointments={visible}
              slots={slots}
              onAppointmentClick={setSelected}
              onDateSelect={openDay}
              isLoading={isLoading}
              hasSlotData={hasSlotData}
            />
          )}
        </>
      )}

      {selected !== null && (
        <AppointmentDetailPanel
          appointment={selected}
          open
          onOpenChange={(open) => !open && setSelected(null)}
          patientSection={
            selected.patientId ? (
              <PatientSummary patientId={selected.patientId} />
            ) : (
              <div className={styles.unresolved}>
                <p>Patient not yet assigned — resolved at check-in.</p>
                <p>{selected.ownerName ?? 'Owner not yet assigned'}</p>
              </div>
            )
          }
          onOpenPatientRecord={
            selected.patientId
              ? () => navigate(`/patients?patient=${selected.patientId}`)
              : undefined
          }
        />
      )}
    </div>
  )
}
