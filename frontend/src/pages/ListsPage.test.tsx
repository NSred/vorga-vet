import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { resetDiagnosesStore } from '@/features/diagnoses/api/mockDiagnosesStore'
import * as allergensApi from '@/features/patients/api/allergensApi'
import * as breedsApi from '@/features/patients/api/breedsApi'
import { ListsPage } from './ListsPage'

function renderPage(path = '/lists') {
  const router = createMemoryRouter([{ path: '/lists', element: <ListsPage /> }], {
    initialEntries: [path],
  })
  render(<RouterProvider router={router} />)
  return router
}

beforeEach(() => {
  resetDiagnosesStore()
  vi.spyOn(breedsApi, 'searchBreeds').mockResolvedValue([{ id: 'b1', name: 'Beagle' }])
  vi.spyOn(allergensApi, 'searchAllergens').mockResolvedValue([{ id: 'a1', name: 'Polen' }])
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ListsPage', () => {
  it('opens on diagnoses', async () => {
    renderPage()

    expect(await screen.findByText('Otitis externa')).toBeInTheDocument()
  })

  it('restores the tab from the URL', async () => {
    renderPage('/lists?tab=allergens')

    expect(await screen.findByText('Polen')).toBeInTheDocument()
  })

  it('switches tabs and writes the tab to the URL', async () => {
    const user = userEvent.setup()
    const router = renderPage()
    await screen.findByText('Otitis externa')

    await user.click(screen.getByRole('button', { name: 'Breeds' }))

    expect(await screen.findByText('Beagle')).toBeInTheDocument()
    expect(router.state.location.search).toBe('?tab=breeds')
  })
})
