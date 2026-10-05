import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { resetPriceListStore } from '@/features/priceList/api/mockPriceListStore'
import { PriceListPage } from './PriceListPage'

function renderPage(path = '/price-list') {
  const router = createMemoryRouter([{ path: '/price-list', element: <PriceListPage /> }], {
    initialEntries: [path],
  })
  render(<RouterProvider router={router} />)
  return router
}

beforeEach(() => {
  resetPriceListStore()
})

describe('PriceListPage', () => {
  it('lists the active services by default', async () => {
    renderPage()

    expect(await screen.findByText('Klinički pregled')).toBeInTheDocument()
    expect(screen.getByText('1.500,00 RSD')).toBeInTheDocument()
    expect(screen.queryByText('Tetoviranje')).not.toBeInTheDocument()
  })

  it('restores the view from the URL', async () => {
    renderPage('/price-list?kind=medication&status=retired')

    expect(await screen.findByText('Rabisin')).toBeInTheDocument()
    expect(screen.getByText('Banminth pasta')).toBeInTheDocument()
    expect(screen.queryByText('Nobivac Rabies')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '＋ New medication' })).toBeInTheDocument()
  })

  it('switches to medications and writes it to the URL', async () => {
    const user = userEvent.setup()
    const router = renderPage()
    await screen.findByText('Klinički pregled')

    await user.click(screen.getByRole('button', { name: 'Medications' }))

    expect(await screen.findByText('NexGard Spectra')).toBeInTheDocument()
    expect(router.state.location.search).toBe('?kind=medication')
  })

  it('keeps the tabs mounted when switching, so the highlight animates, and drops the search', async () => {
    const user = userEvent.setup()
    const router = renderPage()
    await screen.findByText('Klinički pregled')
    const medicationsTab = screen.getByRole('button', { name: 'Medications' })

    await user.type(screen.getByPlaceholderText('Search services'), 'vakc')
    await waitFor(() => expect(router.state.location.search).toContain('search=vakc'))

    await user.click(medicationsTab)

    expect(screen.getByRole('button', { name: 'Medications' })).toBe(medicationsTab)
    expect(medicationsTab).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByPlaceholderText('Search medications')).toHaveValue('')
    expect(await screen.findByText('NexGard Spectra')).toBeInTheDocument()
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(router.state.location.search).toBe('?kind=medication')
  })

  it('adds a service and shows it in the list', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Klinički pregled')

    await user.click(screen.getByRole('button', { name: '＋ New service' }))
    await user.type(screen.getByLabelText('Name *'), 'Ultrazvuk abdomena')
    await user.type(screen.getByLabelText('Price (RSD) *'), '3500')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Ultrazvuk abdomena was added')).toBeInTheDocument()
    expect(await screen.findByText('3.500,00 RSD')).toBeInTheDocument()
  })

  it('retires an item after confirmation and restores it from the retired view', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByText('Obrada rane'))
    await user.click(screen.getByRole('button', { name: 'Retire' }))
    const dialog = await screen.findByRole('dialog', { name: 'Retire Obrada rane?' })
    await user.click(within(dialog).getByRole('button', { name: 'Retire' }))

    expect(await screen.findByText('Obrada rane was retired')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.queryByRole('cell', { name: /Obrada rane/ })).not.toBeInTheDocument(),
    )

    await user.click(screen.getByRole('button', { name: 'Retired' }))
    await user.click(await screen.findByText('Obrada rane'))
    await user.click(screen.getByRole('button', { name: 'Restore' }))

    expect(await screen.findByText('Obrada rane was restored')).toBeInTheDocument()
  })
})
