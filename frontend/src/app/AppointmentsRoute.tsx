import { useAuth } from '@/features/auth'
import { AppointmentsPage } from '@/pages/AppointmentsPage'
import { ClientAppointmentsPage } from '@/pages/ClientAppointmentsPage'

export function AppointmentsRoute() {
  const { user } = useAuth()

  return user?.role === 'veterinarian' ? <AppointmentsPage /> : <ClientAppointmentsPage />
}
