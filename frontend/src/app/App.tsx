import { RouterProvider } from 'react-router'
import { AuthProvider } from '@/features/auth'
import { ToastProvider } from '@/shared/ui'
import { QueryProvider } from '@/app/QueryProvider'
import { router } from '@/app/routes'

export function App() {
  return (
    <ToastProvider>
      <QueryProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryProvider>
    </ToastProvider>
  )
}
