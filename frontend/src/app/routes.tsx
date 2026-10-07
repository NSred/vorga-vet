import { createBrowserRouter, Navigate } from 'react-router'
import { AuthLayout, ProtectedRoute, RoleRoute } from '@/features/auth'
import { AppLayout } from '@/app/layout/AppLayout'
import { AppointmentsRoute } from '@/app/AppointmentsRoute'
import {
  ListsPage,
  LoginPage,
  PatientsPage,
  PriceListPage,
  RegisterPage,
  RemindersPage,
  ReportsPage,
} from '@/app/lazyPages'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { RouteErrorPage } from '@/pages/RouteErrorPage'

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/patients" replace /> },
          { path: '/patients', element: <PatientsPage /> },
          { path: '/appointments', element: <AppointmentsRoute /> },
          {
            element: <RoleRoute allow="veterinarian" />,
            children: [
              { path: '/price-list', element: <PriceListPage /> },
              { path: '/lists', element: <ListsPage /> },
              { path: '/reminders', element: <RemindersPage /> },
              { path: '/reports', element: <ReportsPage /> },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
