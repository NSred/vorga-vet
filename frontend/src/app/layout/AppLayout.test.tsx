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

  it('shows it to a client too, who now has their own visits page', () => {
    renderLayout('client')

    expect(screen.getByRole('link', { name: 'Appointments' })).toBeInTheDocument()
  })

  it('shows the price list link to a vet only', () => {
    renderLayout('veterinarian')
    expect(screen.getByRole('link', { name: 'Price list' })).toHaveAttribute('href', '/price-list')
  })

  it('hides the price list link from a client', () => {
    renderLayout('client')
    expect(screen.queryByRole('link', { name: 'Price list' })).not.toBeInTheDocument()
  })

  it('shows the lists link to a vet only', () => {
    renderLayout('veterinarian')
    expect(screen.getByRole('link', { name: 'Lists' })).toHaveAttribute('href', '/lists')
  })

  it('shows the reminders link to a vet only', () => {
    renderLayout('veterinarian')
    expect(screen.getByRole('link', { name: 'Reminders' })).toHaveAttribute('href', '/reminders')
  })

  it('shows the reports link to a vet only', () => {
    renderLayout('veterinarian')
    expect(screen.getByRole('link', { name: 'Reports' })).toHaveAttribute('href', '/reports')
  })

  it('hides the reports link from a client', () => {
    renderLayout('client')
    expect(screen.queryByRole('link', { name: 'Reports' })).not.toBeInTheDocument()
  })

  it('hides the reminders link from a client', () => {
    renderLayout('client')
    expect(screen.queryByRole('link', { name: 'Reminders' })).not.toBeInTheDocument()
  })

  it('hides the lists link from a client', () => {
    renderLayout('client')
    expect(screen.queryByRole('link', { name: 'Lists' })).not.toBeInTheDocument()
  })
})
