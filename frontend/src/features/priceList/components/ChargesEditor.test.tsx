import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { resetExchangeRateStore, writeExchangeRate } from '../api/mockExchangeRateStore'
import { extraDraft } from '../lib/charges'
import { ChargesEditor } from './ChargesEditor'

afterEach(() => {
  resetExchangeRateStore()
})

function renderEditor() {
  render(
    <ChargesEditor
      drafts={[extraDraft('Bandage', 1500)]}
      onChange={vi.fn()}
      showErrors={false}
      givenOn="2026-10-09"
    />,
  )
}

describe('ChargesEditor euro total', () => {
  it('shows the total in euros once a rate is set', async () => {
    writeExchangeRate(117.2)
    renderEditor()

    expect(screen.getByTestId('charges-total')).toHaveTextContent('1.500,00 RSD')
    expect(await screen.findByText('≈ 12,80 €')).toBeInTheDocument()
  })

  it('shows only dinars without a rate', async () => {
    renderEditor()

    expect(await screen.findByTestId('charges-total')).toHaveTextContent('1.500,00 RSD')
    expect(screen.queryByText(/€/)).not.toBeInTheDocument()
  })
})
