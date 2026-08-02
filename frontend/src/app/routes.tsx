import { createBrowserRouter } from 'react-router'
import { AuthLayout, LoginPage, RegisterPage, ProtectedRoute } from '@/features/auth'
import { AppLayout } from '@/app/layout/AppLayout'
import { DashboardPage } from '@/features/dashboard'

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
        children: [{ path: '/', element: <DashboardPage /> }],
      },
    ],
  },
])
