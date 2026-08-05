import { addDays, addMonths, addWeeks } from 'date-fns'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { getPatients, type Patient } from '@/features/kartoteka'
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
import styles from './ZakazanoPage.module.css'

type PanelState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'view'; appointment: Appointment }
  | { mode: 'edit'; appointment: Appointment }

function isCalendarView(value: string | null): value is CalendarView {
  return value === 'dan' || value === 'nedelja' || value === 'mesec'
}

export function ZakazanoPage() {
  const [searchParams] = useSearchParams()
  const [view, setView] = useState<CalendarView>(() => {
    const param = searchParams.get('view')
    return isCalendarView(param) ? param : 'nedelja'
  })
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const param = searchParams.get('date')
    return param ? parseDateOnly(param) : new Date()
  })

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true)
  const [patients, setPatients] = useState<Patient[]>([])
  const [panel, setPanel] = useState<PanelState>({ mode: 'closed' })

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
    getPatients({ status: 'svi' }).then(setPatients)
  }, [])

  const closePanel = () => setPanel({ mode: 'closed' })

  const handlePrev = () => {
    setCurrentDate((prev) => {
      if (view === 'dan') return addDays(prev, -1)
      if (view === 'nedelja') return addWeeks(prev, -1)
      return addMonths(prev, -1)
    })
  }

  const handleNext = () => {
    setCurrentDate((prev) => {
      if (view === 'dan') return addDays(prev, 1)
      if (view === 'nedelja') return addWeeks(prev, 1)
      return addMonths(prev, 1)
    })
  }

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date)
    setView('dan')
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
    if (!window.confirm('Da li ste sigurni da želite da obrišete ovaj termin?')) {
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

  const viewPatient = panel.mode === 'view' ? patientsById.get(panel.appointment.patientId) : undefined

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Zakazane posete</h1>
          <p className={styles.subtitle}>Kalendar termina — dnevni, nedeljni i mesečni pregled.</p>
        </div>
        <Button variant="primary" type="button" onClick={() => setPanel({ mode: 'create' })}>
          ＋ Novi termin
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

      {!isLoadingAppointments && view === 'dan' && (
        <DayView
          date={currentDate}
          appointments={appointments}
          patients={patientsById}
          onAppointmentClick={(appointment) => setPanel({ mode: 'view', appointment })}
        />
      )}
      {!isLoadingAppointments && view === 'nedelja' && (
        <WeekView
          date={currentDate}
          appointments={appointments}
          patients={patientsById}
          onAppointmentClick={(appointment) => setPanel({ mode: 'view', appointment })}
          onDateSelect={handleDateSelect}
        />
      )}
      {!isLoadingAppointments && view === 'mesec' && (
        <MonthView
          date={currentDate}
          appointments={appointments}
          patients={patientsById}
          onAppointmentClick={(appointment) => setPanel({ mode: 'view', appointment })}
          onDateSelect={handleDateSelect}
        />
      )}

      {panel.mode === 'view' && viewPatient && (
        <AppointmentDetailPanel
          appointment={panel.appointment}
          patient={viewPatient}
          open
          onOpenChange={(open) => !open && closePanel()}
          onEdit={() => setPanel({ mode: 'edit', appointment: panel.appointment })}
          onDelete={() => handleDelete(panel.appointment.id)}
          onAppointmentChange={handleAppointmentChange}
        />
      )}

      {panel.mode === 'create' && (
        <AppointmentFormPanel
          open
          onOpenChange={(open) => !open && closePanel()}
          mode="create"
          patients={patients}
          onSubmit={handleCreateSubmit}
        />
      )}

      {panel.mode === 'edit' && (
        <AppointmentFormPanel
          open
          onOpenChange={(open) => !open && closePanel()}
          mode="edit"
          initialAppointment={panel.appointment}
          patients={patients}
          onSubmit={handleEditSubmit}
          onDelete={() => handleDelete(panel.appointment.id)}
        />
      )}
    </div>
  )
}
