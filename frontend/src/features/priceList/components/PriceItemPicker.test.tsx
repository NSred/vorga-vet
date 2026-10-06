import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { listItems, resetPriceListStore } from '../api/mockPriceListStore'
import { PriceItemPicker } from './PriceItemPicker'

beforeEach(() => {
  resetPriceListStore()
})

describe('PriceItemPicker', () => {
  it('offers only active items of its kind, with their price', async () => {
    const user = userEvent.setup()
    render(<PriceItemPicker kind="medication" onPick={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Add medication' }))

    expect(
      await screen.findByRole('option', { name: /Synulox.*150,00 RSD \/ tbl\./ }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /Rabisin/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /Klinički pregled/ })).not.toBeInTheDocument()
  })

  it('hands the picked item to the caller', async () => {
    const onPick = vi.fn()
    const user = userEvent.setup()
    render(<PriceItemPicker kind="service" onPick={onPick} />)

    await user.click(screen.getByRole('button', { name: 'Add service' }))
    await user.click(await screen.findByRole('option', { name: /^Obrada rane/ }))

    expect(onPick).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Obrada rane', price: 1200 }),
    )
  })

  it('creates a missing item on the price list and picks it', async () => {
    const onPick = vi.fn()
    const user = userEvent.setup()
    render(<PriceItemPicker kind="medication" onPick={onPick} />)

    await user.click(screen.getByRole('button', { name: 'Add medication' }))
    await user.type(screen.getByLabelText('Search Add medication'), 'Drontal Plus')
    await user.click(
      await screen.findByRole('button', { name: /Create medication "Drontal Plus"/ }),
    )

    const dialog = await screen.findByRole('dialog', { name: 'New medication' })
    expect(within(dialog).getByLabelText('Name *')).toHaveValue('Drontal Plus')
    await user.click(within(dialog).getByRole('combobox', { name: 'Unit' }))
    await user.click(await screen.findByRole('option', { name: 'tbl.' }))
    await user.type(within(dialog).getByLabelText('Price (RSD) *'), '250')
    await user.click(within(dialog).getByRole('button', { name: 'Add to price list' }))

    await waitFor(() =>
      expect(onPick).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'medication',
          name: 'Drontal Plus',
          price: 250,
          unit: 'tbl.',
        }),
      ),
    )
    expect(
      listItems('medication', { search: 'Drontal', status: 0, page: 1, pageSize: 25 }).totalCount,
    ).toBe(1)
  })

  it('refuses a name already on the list, retired ones included', async () => {
    const user = userEvent.setup()
    render(<PriceItemPicker kind="medication" onPick={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Add medication' }))
    await user.type(screen.getByLabelText('Search Add medication'), 'Rabisin')
    await user.click(await screen.findByRole('button', { name: /Create medication "Rabisin"/ }))
    const dialog = await screen.findByRole('dialog', { name: 'New medication' })
    await user.type(within(dialog).getByLabelText('Price (RSD) *'), '900')
    await user.click(within(dialog).getByRole('button', { name: 'Add to price list' }))

    expect(await within(dialog).findByText(/already on the price list/)).toBeInTheDocument()
  })
})
