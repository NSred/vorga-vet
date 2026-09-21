import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types'

export interface RoleRouteProps {
  allow: UserRole
}

export function RoleRoute({ allow }: RoleRouteProps) {
  const { user } = useAuth()

  if (user?.role !== allow) {
    return <Navigate to="/patients" replace />
  }

  return <Outlet />
}
