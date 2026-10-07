import { act, render, screen } from '@testing-library/react'
import { lazy, type ComponentType } from 'react'
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
  it('labels the navigation strip', () => {
    renderLayout('veterinarian')

    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
  })

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

  it('keeps the header on screen while a page is still loading', async () => {
    auth.role = 'veterinarian'
    let finishLoading: (page: { default: ComponentType }) => void = () => undefined
    const SlowPage = lazy(
      () => new Promise<{ default: ComponentType }>((resolve) => (finishLoading = resolve)),
    )
    const router = createMemoryRouter(
      [{ element: <AppLayout />, children: [{ path: '/patients', element: <SlowPage /> }] }],
      { initialEntries: ['/patients'] },
    )
    render(<RouterProvider router={router} />)

    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(screen.queryByText('patients page')).not.toBeInTheDocument()

    await act(async () => finishLoading({ default: () => <p>patients page</p> }))

    expect(await screen.findByText('patients page')).toBeInTheDocument()
  })
})
