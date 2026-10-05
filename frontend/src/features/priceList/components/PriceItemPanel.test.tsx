import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { ApiError } from '@/shared/lib/apiClient'
import * as priceListApi from '../api/priceListApi'
import { resetPriceListStore } from '../api/mockPriceListStore'
import type { PriceListItem } from '../types'
import { PriceItemPanel } from './PriceItemPanel'

const medication: PriceListItem = {
  id: 'seed-medication-11',
  kind: 'medication',
  name: 'Ivermectin sol.',
  price: 60,
  unit: 'ml',
  isActive: true,
}

function renderCreate(kind: 'service' | 'medication') {
  const props = { onOpenChange: vi.fn(), onSaved: vi.fn(), onMissing: vi.fn() }
  render(<PriceItemPanel mode="create" kind={kind} open {...props} />)
  return props
}

function renderEdit(item: PriceListItem) {
  const props = {
    onOpenChange: vi.fn(),
    onSaved: vi.fn(),
    onMissing: vi.fn(),
    onRetire: vi.fn(),
    onRestore: vi.fn(),
  }
  render(<PriceItemPanel mode="edit" kind={item.kind} item={item} open {...props} />)
  return props
}

beforeEach(() => {
  resetPriceListStore()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PriceItemPanel', () => {
  it('shows no unit field for a service', () => {
    renderCreate('service')

    expect(screen.getByRole('dialog', { name: 'New service' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Unit')).not.toBeInTheDocument()
  })

  it('creates a medication with a comma price', async () => {
    const createSpy = vi.spyOn(priceListApi, 'createPriceListItem')
    const user = userEvent.setup()
    const props = renderCreate('medication')

    await user.type(screen.getByLabelText('Name *'), ' Drontal Plus ')
    await user.click(screen.getByRole('combobox', { name: 'Unit' }))
    await user.click(await screen.findByRole('option', { name: 'tbl.' }))
    await user.type(screen.getByLabelText('Price (RSD) *'), '250,50')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(props.onSaved).toHaveBeenCalledWith('Drontal Plus'))
    expect(createSpy).toHaveBeenCalledWith('medication', {
      name: 'Drontal Plus',
      price: 250.5,
      unit: 'tbl.',
      isVaccine: false,
      isRabies: false,
      validityDays: null,
    })
  })

  it('marks a medication as a rabies vaccine with how long it lasts', async () => {
    const createSpy = vi.spyOn(priceListApi, 'createPriceListItem')
    const user = userEvent.setup()
    renderCreate('medication')

    expect(screen.getByRole('button', { name: 'Not a vaccine' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByText(/creates no reminder/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Lasts (days) *')).not.toBeInTheDocument()
    await user.type(screen.getByLabelText('Name *'), 'Versican Plus')
    await user.type(screen.getByLabelText('Price (RSD) *'), '1700')
    await user.click(screen.getByRole('button', { name: 'Vaccine' }))
    expect(screen.getByText(/reminds when the next one is due/)).toBeInTheDocument()
    expect(screen.getByLabelText('Lasts (days) *')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Rabies vaccine' }))
    expect(screen.getByRole('button', { name: 'Vaccine' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText(/own reminder and certificate/)).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Lasts (days) *'))
    await user.type(screen.getByLabelText('Lasts (days) *'), '0')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Enter 1 to 3650 days')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Lasts (days) *'))
    await user.type(screen.getByLabelText('Lasts (days) *'), '1095')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(createSpy).toHaveBeenCalledWith(
        'medication',
        expect.objectContaining({ isVaccine: true, isRabies: true, validityDays: 1095 }),
      ),
    )
  })

  it('offers no vaccine marks for a service', () => {
    renderCreate('service')

    expect(screen.queryByRole('button', { name: 'Rabies vaccine' })).not.toBeInTheDocument()
  })

  it('explains each invalid field and does not save', async () => {
    const createSpy = vi.spyOn(priceListApi, 'createPriceListItem')
    const user = userEvent.setup()
    renderCreate('medication')

    await user.type(screen.getByLabelText('Price (RSD) *'), '12,345')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Name is required')).toBeInTheDocument()
    expect(screen.getByText('Enter an amount such as 1500 or 1500,50')).toBeInTheDocument()
    expect(createSpy).not.toHaveBeenCalled()
  })

  it('puts a duplicate name on the name field', async () => {
    const user = userEvent.setup()
    const props = renderCreate('service')

    await user.type(screen.getByLabelText('Name *'), 'tetoviranje')
    await user.type(screen.getByLabelText('Price (RSD) *'), '100')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText(/already on the price list/)).toBeInTheDocument()
    expect(props.onSaved).not.toHaveBeenCalled()
  })

  it('prefills an item and saves the change', async () => {
    const user = userEvent.setup()
    const props = renderEdit(medication)

    expect((screen.getByLabelText('Price (RSD) *') as HTMLInputElement).value).toBe('60')
    await user.clear(screen.getByLabelText('Price (RSD) *'))
    await user.type(screen.getByLabelText('Price (RSD) *'), '75')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(props.onSaved).toHaveBeenCalledWith('Ivermectin sol.'))
  })

  it('reports a missing item', async () => {
    vi.spyOn(priceListApi, 'updatePriceListItem').mockRejectedValue(
      new ApiError(404, 'gone', 'Medications.NotFound'),
    )
    const user = userEvent.setup()
    const props = renderEdit(medication)

    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(props.onMissing).toHaveBeenCalled())
  })

  it('offers retire for an active item and restore for a retired one', async () => {
    const user = userEvent.setup()
    const active = renderEdit(medication)

    await user.click(screen.getByRole('button', { name: 'Retire' }))
    expect(active.onRetire).toHaveBeenCalled()
  })

  it('marks a retired item and offers restore', async () => {
    const user = userEvent.setup()
    const retired = renderEdit({ ...medication, isActive: false })

    expect(screen.getByText('Retired')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Retire' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Restore' }))
    expect(retired.onRestore).toHaveBeenCalled()
  })

  it('keeps a unit that is not on the list when editing', async () => {
    const user = userEvent.setup()
    renderEdit({ ...medication, unit: 'bočica' })

    expect(screen.getByRole('combobox', { name: 'Unit' })).toHaveTextContent('bočica')
    await user.click(screen.getByRole('combobox', { name: 'Unit' }))
    expect(await screen.findByRole('option', { name: 'džak' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'No unit' })).toBeInTheDocument()
  })
})
