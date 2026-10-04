import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { NotFoundPage } from './NotFoundPage'
import { RouteErrorPage } from './RouteErrorPage'

function Boom(): never {
  throw new Error('render failed')
}

describe('route errors', () => {
  it('shows the not-found page for an unknown path', () => {
    const router = createMemoryRouter(
      [
        { path: '/patients', element: <div /> },
        { path: '*', element: <NotFoundPage /> },
      ],
      { initialEntries: ['/nowhere'] },
    )

    render(<RouterProvider router={router} />)

    expect(screen.getByText('Page not found')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to patients' })).toHaveAttribute(
      'href',
      '/patients',
    )
  })

  it('shows the error page when a route throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const router = createMemoryRouter(
      [{ path: '/', element: <Boom />, errorElement: <RouteErrorPage /> }],
      { initialEntries: ['/'] },
    )

    render(<RouterProvider router={router} />)

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to patients' })).toBeInTheDocument()
    vi.restoreAllMocks()
  })
})
