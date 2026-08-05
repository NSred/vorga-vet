import { createBrowserRouter } from 'react-router'
import { AuthLayout, LoginPage, RegisterPage, ProtectedRoute } from '@/features/auth'
import { AppLayout } from '@/app/layout/AppLayout'
import { PatientsPage } from '@/features/patients'
import { AppointmentsPage } from '@/features/appointments'

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <PatientsPage /> },
          { path: '/appointments', element: <AppointmentsPage /> },
        ],
      },
    ],
  },
])
