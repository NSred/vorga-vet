import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { RoleRoute } from './RoleRoute'

const auth = vi.hoisted(() => ({ role: 'veterinarian' as 'veterinarian' | 'client' }))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { userId: 'u1', email: 'user@example.com', role: auth.role } }),
}))

function renderAt(role: 'veterinarian' | 'client') {
  auth.role = role

  const router = createMemoryRouter(
    [
      {
        element: <RoleRoute allow="veterinarian" />,
        children: [{ path: '/appointments', element: <p>calendar</p> }],
      },
      { path: '/patients', element: <p>patients</p> },
    ],
    { initialEntries: ['/appointments'] },
  )

  render(<RouterProvider router={router} />)
}

describe('RoleRoute', () => {
  it('renders the route for the allowed role', () => {
    renderAt('veterinarian')

    expect(screen.getByText('calendar')).toBeInTheDocument()
  })

  it('redirects everyone else to patients', () => {
    renderAt('client')

    expect(screen.getByText('patients')).toBeInTheDocument()
  })
})
