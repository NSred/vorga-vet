import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { reloadPage } from '@/shared/lib/reloadPage'
import { NotFoundPage } from './NotFoundPage'
import { RouteErrorPage } from './RouteErrorPage'

vi.mock('@/shared/lib/reloadPage', () => ({ reloadPage: vi.fn() }))

function Boom(): never {
  throw new Error('render failed')
}

function MissingPageFile(): never {
  throw new TypeError(
    'Failed to fetch dynamically imported module: http://localhost/assets/ReportsPage-old.js',
  )
}

function renderError(element: ReactElement) {
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  const router = createMemoryRouter([{ path: '/', element, errorElement: <RouteErrorPage /> }], {
    initialEntries: ['/'],
  })
  render(<RouterProvider router={router} />)
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
    renderError(<Boom />)

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to patients' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reload' })).not.toBeInTheDocument()
    vi.restoreAllMocks()
  })

  it('offers a reload when a page file from an older version is gone', async () => {
    renderError(<MissingPageFile />)

    expect(await screen.findByText('VorgaVet was updated')).toBeInTheDocument()
    expect(screen.getByText('Reload to get the new version.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Reload' }))

    expect(reloadPage).toHaveBeenCalledTimes(1)
    vi.restoreAllMocks()
  })
})
