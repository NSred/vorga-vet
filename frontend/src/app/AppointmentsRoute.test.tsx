import { render, screen } from '@testing-library/react'
import { Suspense } from 'react'
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

function renderRoute() {
  render(
    <Suspense fallback={null}>
      <AppointmentsRoute />
    </Suspense>,
  )
}

describe('AppointmentsRoute', () => {
  it('gives a veterinarian the calendar', async () => {
    auth.role = 'veterinarian'

    renderRoute()

    expect(await screen.findByText('vet calendar')).toBeInTheDocument()
    expect(screen.queryByText('client visits')).not.toBeInTheDocument()
  })

  it('gives a client their own visits', async () => {
    auth.role = 'client'

    renderRoute()

    expect(await screen.findByText('client visits')).toBeInTheDocument()
    expect(screen.queryByText('vet calendar')).not.toBeInTheDocument()
  })
})
