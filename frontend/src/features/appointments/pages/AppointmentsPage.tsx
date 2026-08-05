import { addDays, addMonths, addWeeks } from 'date-fns'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { getPatients, type Patient } from '@/features/patients'
import { Button } from '@/shared/ui'
import { parseDateOnly } from '@/shared/lib/dateOnly'
import { AppointmentDetailPanel } from '../components/AppointmentDetailPanel'
import { AppointmentFormPanel } from '../components/AppointmentFormPanel'
import { CalendarToolbar } from '../components/CalendarToolbar'
import { DayView } from '../components/DayView'
import { MonthView } from '../components/MonthView'
import { WeekView } from '../components/WeekView'
import { createAppointment, deleteAppointment, getAppointments, updateAppointment } from '../api/appointmentsApi'
import type { Appointment, AppointmentInput, CalendarView } from '../types'
import styles from './AppointmentsPage.module.css'

type PanelState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'view'; appointment: Appointment }
  | { mode: 'edit'; appointment: Appointment }

function isCalendarView(value: string | null): value is CalendarView {
  return value === 'day' || value === 'week' || value === 'month'
}

export function AppointmentsPage() {
  const [searchParams] = useSearchParams()
  const [view, setView] = useState<CalendarView>(() => {
    const param = searchParams.get('view')
    return isCalendarView(param) ? param : 'week'
  })
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const param = searchParams.get('date')
    return param ? parseDateOnly(param) : new Date()
  })

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true)
  const [patients, setPatients] = useState<Patient[]>([])
  const [panel, setPanel] = useState<PanelState>({ mode: 'closed' })
  const [displayPanel, setDisplayPanel] = useState<PanelState>({ mode: 'closed' })
  if (panel.mode !== 'closed' && panel !== displayPanel) {
    setDisplayPanel(panel)
  }

  const patientsById = useMemo(() => new Map(patients.map((patient) => [patient.id, patient])), [patients])

  const refreshAppointments = useCallback(() => {
    setIsLoadingAppointments(true)
    getAppointments()
      .then(setAppointments)
      .finally(() => setIsLoadingAppointments(false))
  }, [])

  useEffect(() => {
    refreshAppointments()
  }, [refreshAppointments])

  useEffect(() => {
    getPatients({ status: 'all' }).then(setPatients)
  }, [])

  const closePanel = () => setPanel({ mode: 'closed' })

  const handlePrev = () => {
    setCurrentDate((prev) => {
      if (view === 'day') return addDays(prev, -1)
      if (view === 'week') return addWeeks(prev, -1)
      return addMonths(prev, -1)
    })
  }

  const handleNext = () => {
    setCurrentDate((prev) => {
      if (view === 'day') return addDays(prev, 1)
      if (view === 'week') return addWeeks(prev, 1)
      return addMonths(prev, 1)
    })
  }

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date)
    setView('day')
  }

  const handleCreateSubmit = async (input: AppointmentInput) => {
    await createAppointment(input)
    closePanel()
    refreshAppointments()
  }

  const handleEditSubmit = async (input: AppointmentInput) => {
    if (panel.mode !== 'edit') return
    await updateAppointment(panel.appointment.id, input)
    closePanel()
    refreshAppointments()
  }

  const handleDelete = async (appointmentId: string) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) {
      return
    }
    await deleteAppointment(appointmentId)
    closePanel()
    refreshAppointments()
  }

  const handleAppointmentChange = (updated: Appointment) => {
    setAppointments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
    setPanel((prev) => (prev.mode === 'view' && prev.appointment.id === updated.id ? { mode: 'view', appointment: updated } : prev))
  }

  const viewPatient = displayPanel.mode === 'view' ? patientsById.get(displayPanel.appointment.patientId) : undefined

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Appointments</h1>
          <p className={styles.subtitle}>Appointment calendar — day, week, and month view.</p>
        </div>
        <Button variant="primary" type="button" onClick={() => setPanel({ mode: 'create' })}>
          ＋ New appointment
        </Button>
      </div>

      <CalendarToolbar
        view={view}
        onViewChange={setView}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={() => setCurrentDate(new Date())}
      />

      {!isLoadingAppointments && view === 'day' && (
        <DayView
          date={currentDate}
          appointments={appointments}
          patients={patientsById}
          onAppointmentClick={(appointment) => setPanel({ mode: 'view', appointment })}
        />
      )}
      {!isLoadingAppointments && view === 'week' && (
        <WeekView
          date={currentDate}
          appointments={appointments}
          patients={patientsById}
          onAppointmentClick={(appointment) => setPanel({ mode: 'view', appointment })}
          onDateSelect={handleDateSelect}
        />
      )}
      {!isLoadingAppointments && view === 'month' && (
        <MonthView
          date={currentDate}
          appointments={appointments}
          patients={patientsById}
          onAppointmentClick={(appointment) => setPanel({ mode: 'view', appointment })}
          onDateSelect={handleDateSelect}
        />
      )}

      {displayPanel.mode === 'view' && viewPatient && (
        <AppointmentDetailPanel
          appointment={displayPanel.appointment}
          patient={viewPatient}
          open={panel.mode === 'view'}
          onOpenChange={(open) => !open && closePanel()}
          onEdit={() => setPanel({ mode: 'edit', appointment: displayPanel.appointment })}
          onDelete={() => handleDelete(displayPanel.appointment.id)}
          onAppointmentChange={handleAppointmentChange}
        />
      )}

      {displayPanel.mode === 'create' && (
        <AppointmentFormPanel
          open={panel.mode === 'create'}
          onOpenChange={(open) => !open && closePanel()}
          mode="create"
          patients={patients}
          onSubmit={handleCreateSubmit}
        />
      )}

      {displayPanel.mode === 'edit' && (
        <AppointmentFormPanel
          open={panel.mode === 'edit'}
          onOpenChange={(open) => !open && closePanel()}
          mode="edit"
          initialAppointment={displayPanel.appointment}
          patients={patients}
          onSubmit={handleEditSubmit}
          onDelete={() => handleDelete(displayPanel.appointment.id)}
        />
      )}
    </div>
  )
}
