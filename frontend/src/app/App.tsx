import { RouterProvider } from 'react-router'
import { AuthProvider } from '@/features/auth'
import { ToastProvider } from '@/shared/ui'
import { router } from '@/app/routes'

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ToastProvider>
  )
}
