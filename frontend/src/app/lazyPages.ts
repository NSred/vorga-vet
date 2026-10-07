import { lazy } from 'react'

export const LoginPage = lazy(() =>
  import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
)
export const RegisterPage = lazy(() =>
  import('@/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })),
)
export const PatientsPage = lazy(() =>
  import('@/pages/PatientsPage').then((m) => ({ default: m.PatientsPage })),
)
export const AppointmentsPage = lazy(() =>
  import('@/pages/AppointmentsPage').then((m) => ({ default: m.AppointmentsPage })),
)
export const ClientAppointmentsPage = lazy(() =>
  import('@/pages/ClientAppointmentsPage').then((m) => ({ default: m.ClientAppointmentsPage })),
)
export const PriceListPage = lazy(() =>
  import('@/pages/PriceListPage').then((m) => ({ default: m.PriceListPage })),
)
export const ListsPage = lazy(() =>
  import('@/pages/ListsPage').then((m) => ({ default: m.ListsPage })),
)
export const RemindersPage = lazy(() =>
  import('@/pages/RemindersPage').then((m) => ({ default: m.RemindersPage })),
)
export const ReportsPage = lazy(() =>
  import('@/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })),
)
