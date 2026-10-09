import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { readExchangeRate, resetExchangeRateStore } from '../api/mockExchangeRateStore'
import { ExchangeRateTab } from './ExchangeRateTab'

afterEach(() => {
  resetExchangeRateStore()
})

describe('ExchangeRateTab', () => {
  it('saves a rate typed with a decimal comma and shows an example', async () => {
    const user = userEvent.setup()
    render(<ExchangeRateTab />)

    await user.type(await screen.findByLabelText('Dinars for one euro'), '117,20')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Euro rate saved')).toBeInTheDocument()
    expect(readExchangeRate().rsdPerEur).toBe(117.2)
    expect(await screen.findByText(/1\.500,00 RSD is ≈ 12,80 €/)).toBeInTheDocument()
  })

  it('rejects a rate that is not a number or out of range', async () => {
    const user = userEvent.setup()
    render(<ExchangeRateTab />)

    const input = await screen.findByLabelText('Dinars for one euro')
    await user.type(input, 'abc')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByText('Enter a rate such as 117,20')).toBeInTheDocument()

    await user.clear(input)
    await user.type(input, '0')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByText('The rate must be greater than 0 and at most 1000')).toBeInTheDocument()
    expect(readExchangeRate().rsdPerEur).toBeNull()
  })
})
