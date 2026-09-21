import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AppointmentsRoute } from './AppointmentsRoute'

const auth = vi.hoisted(() => ({ role: 'veterinarian' as 'veterinarian' | 'client' }))

vi.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { userId: 'u1', email: 'user@example.com', role: auth.role } }),
}))

vi.mock('@/pages/AppointmentsPage', () => ({
  AppointmentsPage: () => <p>vet calendar</p>,
}))

vi.mock('@/pages/ClientAppointmentsPage', () => ({
  ClientAppointmentsPage: () => <p>client visits</p>,
}))

describe('AppointmentsRoute', () => {
  it('gives a veterinarian the calendar', () => {
    auth.role = 'veterinarian'

    render(<AppointmentsRoute />)

    expect(screen.getByText('vet calendar')).toBeInTheDocument()
    expect(screen.queryByText('client visits')).not.toBeInTheDocument()
  })

  it('gives a client their own visits', () => {
    auth.role = 'client'

    render(<AppointmentsRoute />)

    expect(screen.getByText('client visits')).toBeInTheDocument()
    expect(screen.queryByText('vet calendar')).not.toBeInTheDocument()
  })
})
