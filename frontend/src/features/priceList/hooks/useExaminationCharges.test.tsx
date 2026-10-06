import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { pickFromPriceList } from '@/test/priceListPicking'
import { getCharges, resetChargesStore, saveCharges } from '../api/mockChargesStore'
import { listItems, resetPriceListStore } from '../api/mockPriceListStore'
import { useExaminationCharges } from './useExaminationCharges'

function Harness({ examinationId, earlierCost }: { examinationId?: string; earlierCost?: number }) {
  const charges = useExaminationCharges({ open: true, examinationId, earlierCost })
  const [result, setResult] = useState('')

  return (
    <div>
      {charges.section}
      <p data-testid="slot-total">{charges.total === undefined ? 'none' : String(charges.total)}</p>
      <button type="button" onClick={() => setResult(charges.validate() ? 'valid' : 'invalid')}>
        Validate
      </button>
      <button type="button" onClick={() => void charges.commit('e7')}>
        Commit
      </button>
      <p data-testid="validation">{result}</p>
    </div>
  )
}

beforeEach(() => {
  resetPriceListStore()
  resetChargesStore()
})

describe('useExaminationCharges', () => {
  it('starts empty for a new exam and has no total', async () => {
    render(<Harness />)

    expect(await screen.findByTestId('charges-total')).toHaveTextContent('No charges')
    expect(screen.getByTestId('slot-total')).toHaveTextContent('none')
  })

  it('totals picked items and an additional cost as the vet types', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await pickFromPriceList(user, 'Add service', 'Vakcinacija protiv besnila')
    await pickFromPriceList(user, 'Add medication', 'Nobivac Rabies')
    await user.click(screen.getByRole('button', { name: '＋ Additional cost' }))
    await user.type(screen.getByLabelText('Description of additional cost 3'), 'Night visit')
    await user.type(screen.getByLabelText('Price of Night visit'), '1000')

    expect(screen.getByTestId('charges-total')).toHaveTextContent('4.400,00 RSD')
    expect(screen.getByTestId('slot-total')).toHaveTextContent('4400')
  })

  it('changes a price on the exam only, never on the price list', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await pickFromPriceList(user, 'Add service', 'Klinički pregled')
    await user.clear(screen.getByLabelText('Price of Klinički pregled'))
    await user.type(screen.getByLabelText('Price of Klinički pregled'), '1000')

    expect(screen.getByTestId('slot-total')).toHaveTextContent('1000')
    const listed = listItems('service', { search: 'Klinički', status: 0, page: 1, pageSize: 25 })
      .items[0]
    expect(listed.price).toBe(1500)
  })

  it('shows what is wrong only after validation, and removes a line', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(await screen.findByRole('button', { name: '＋ Additional cost' }))
    expect(screen.queryByText(/Describe the cost/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Validate' }))
    expect(screen.getByTestId('validation')).toHaveTextContent('invalid')
    expect(screen.getByText('Describe the cost · Price is required')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove additional cost 1' }))
    await user.click(screen.getByRole('button', { name: 'Validate' }))
    expect(screen.getByTestId('validation')).toHaveTextContent('valid')
  })

  it('opens an old exam with its hand-typed cost as a line', async () => {
    render(<Harness examinationId="e-old" earlierCost={45.5} />)

    expect(await screen.findByLabelText('Description of additional cost 1')).toHaveValue(
      'Cost entered earlier',
    )
    expect(screen.getByTestId('charges-total')).toHaveTextContent('45,50 RSD')
  })

  it('loads saved lines instead of the earlier cost and saves under the given id', async () => {
    saveCharges('e-saved', [
      {
        id: 'x1',
        kind: 'service',
        itemId: 's1',
        name: 'Obrada rane',
        unitPrice: 1200,
        quantity: 1,
      },
    ])
    const user = userEvent.setup()
    render(<Harness examinationId="e-saved" earlierCost={1200} />)

    expect(await screen.findByText('Obrada rane')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('Cost entered earlier')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Commit' }))
    await waitFor(() =>
      expect(getCharges('e7').lines.map((line) => line.name)).toEqual(['Obrada rane']),
    )
  })

  it('asks a vaccine line for its batch and next due date, and other lines for neither', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await pickFromPriceList(user, 'Add medication', 'Synulox')
    expect(screen.queryByLabelText('Batch of Synulox')).not.toBeInTheDocument()

    await pickFromPriceList(user, 'Add medication', 'Vanguard Plus 7')
    expect(screen.getByLabelText('Batch of Vanguard Plus 7')).toBeInTheDocument()
    expect(screen.getByText('Vaccine')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Next due for Vanguard Plus 7/ })).toBeInTheDocument()
  })
})
