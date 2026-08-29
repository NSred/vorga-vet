import { createBrowserRouter, Navigate } from 'react-router'
import { AuthLayout, ProtectedRoute } from '@/features/auth'
import { AppLayout } from '@/app/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { PatientsPage } from '@/pages/PatientsPage'
import { AppointmentsPage } from '@/pages/AppointmentsPage'

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
          { index: true, element: <Navigate to="/patients" replace /> },
          { path: '/patients', element: <PatientsPage /> },
          { path: '/appointments', element: <AppointmentsPage /> },
        ],
      },
    ],
  },
])
