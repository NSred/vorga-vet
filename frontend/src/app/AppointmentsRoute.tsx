import { useAuth } from '@/features/auth'
import { AppointmentsPage, ClientAppointmentsPage } from '@/app/lazyPages'

export function AppointmentsRoute() {
  const { user } = useAuth()

  return user?.role === 'veterinarian' ? <AppointmentsPage /> : <ClientAppointmentsPage />
}
