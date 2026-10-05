import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { resetDiagnosesStore } from '../api/mockDiagnosesStore'
import { DiagnosesTab } from './DiagnosesTab'

function renderTab(path = '/lists') {
  const router = createMemoryRouter([{ path: '/lists', element: <DiagnosesTab /> }], {
    initialEntries: [path],
  })
  render(<RouterProvider router={router} />)
  return router
}

beforeEach(() => {
  resetDiagnosesStore()
})

describe('DiagnosesTab', () => {
  it('lists active diagnoses with their codes', async () => {
    renderTab()

    expect(await screen.findByText('Otitis externa')).toBeInTheDocument()
    expect(screen.getByText('D02')).toBeInTheDocument()
    expect(screen.queryByText('Vakcinacija')).not.toBeInTheDocument()
  })

  it('restores the retired view from the URL', async () => {
    renderTab('/lists?status=retired')

    expect(await screen.findByText('Vakcinacija')).toBeInTheDocument()
    expect(screen.queryByText('Otitis externa')).not.toBeInTheDocument()
  })

  it('adds a diagnosis and explains invalid and duplicate input', async () => {
    const user = userEvent.setup()
    renderTab()
    await screen.findByText('Otitis externa')

    await user.click(screen.getByRole('button', { name: '＋ New diagnosis' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Name is required')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Name *'), 'Otitis media')
    await user.type(screen.getByLabelText('Code'), 'd01')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Another diagnosis already uses this code.')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Code'))
    await user.clear(screen.getByLabelText('Name *'))
    await user.type(screen.getByLabelText('Name *'), 'Vakcinacija')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText(/already on the list/)).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Name *'))
    await user.type(screen.getByLabelText('Name *'), 'Otitis media')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Otitis media was added')).toBeInTheDocument()
  })

  it('retires after confirmation and restores from the retired view', async () => {
    const user = userEvent.setup()
    renderTab()

    await user.click(await screen.findByText('Cystitis'))
    await user.click(screen.getByRole('button', { name: 'Retire' }))
    const dialog = await screen.findByRole('dialog', { name: 'Retire Cystitis?' })
    await user.click(within(dialog).getByRole('button', { name: 'Retire' }))
    expect(await screen.findByText('Cystitis was retired')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Retired' }))
    await user.click(await screen.findByText('Cystitis'))
    await user.click(screen.getByRole('button', { name: 'Restore' }))
    expect(await screen.findByText('Cystitis was restored')).toBeInTheDocument()
  })

  it('pastes a list and reports what was added and skipped', async () => {
    const user = userEvent.setup()
    renderTab()
    await screen.findByText('Otitis externa')

    await user.click(screen.getByRole('button', { name: 'Paste a list' }))
    const dialog = await screen.findByRole('dialog', { name: 'Paste a list of diagnoses' })
    await user.type(
      within(dialog).getByLabelText('Diagnoses'),
      'Otitis media{enter}{enter}cystitis{enter}Rhinitis{enter}rhinitis',
    )
    await user.click(within(dialog).getByRole('button', { name: 'Add 3' }))

    expect(await screen.findByText('2 diagnoses added, 1 skipped')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Rhinitis')).toBeInTheDocument())
  })
})
