import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { AppLayout } from './AppLayout'

const auth = vi.hoisted(() => ({ role: 'veterinarian' as 'veterinarian' | 'client' }))

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { userId: 'u1', email: 'user@example.com', role: auth.role },
    logout: vi.fn(),
  }),
}))

function renderLayout(role: 'veterinarian' | 'client') {
  auth.role = role

  const router = createMemoryRouter(
    [{ element: <AppLayout />, children: [{ path: '/patients', element: <p>patients</p> }] }],
    { initialEntries: ['/patients'] },
  )

  render(<RouterProvider router={router} />)
}

describe('AppLayout navigation', () => {
  it('shows the appointments link to a vet', () => {
    renderLayout('veterinarian')

    expect(screen.getByRole('link', { name: 'Appointments' })).toBeInTheDocument()
  })

  it('hides it from a client', () => {
    renderLayout('client')

    expect(screen.queryByRole('link', { name: 'Appointments' })).not.toBeInTheDocument()
  })
})
