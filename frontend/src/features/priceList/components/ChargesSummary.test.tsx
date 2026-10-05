import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { resetChargesStore, saveCharges } from '../api/mockChargesStore'
import { ChargesSummary } from './ChargesSummary'

beforeEach(() => {
  resetChargesStore()
})

describe('ChargesSummary', () => {
  it('lists each line with its quantity, dose and amount', async () => {
    saveCharges('e1', [
      {
        id: 'a',
        kind: 'service',
        itemId: 's1',
        name: 'Klinički pregled',
        unitPrice: 1500,
        quantity: 1,
      },
      {
        id: 'b',
        kind: 'medication',
        itemId: 'm1',
        name: 'Synulox',
        unitPrice: 150,
        quantity: 2,
        dose: '1 tbl. x 5 dana',
      },
    ])

    render(<ChargesSummary examinationId="e1" />)

    expect(await screen.findByText('Klinički pregled')).toBeInTheDocument()
    expect(screen.getByText('1.500,00 RSD')).toBeInTheDocument()
    expect(screen.getByText(/1 tbl\. x 5 dana/)).toBeInTheDocument()
    expect(screen.getByText('2 × 300,00 RSD')).toBeInTheDocument()
  })

  it('renders nothing for an exam without lines', async () => {
    render(<ChargesSummary examinationId="none" />)

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(screen.queryByRole('list', { name: 'Charges' })).not.toBeInTheDocument()
  })
})
