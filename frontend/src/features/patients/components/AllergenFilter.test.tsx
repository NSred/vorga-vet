import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AllergenFilter } from './AllergenFilter'
import * as allergensApi from '../api/allergensApi'

afterEach(() => {
  vi.restoreAllMocks()
})

function stubSearch() {
  vi.spyOn(allergensApi, 'searchAllergens').mockResolvedValue([{ id: 'a1', name: 'Pollen' }])
}

describe('AllergenFilter', () => {
  it('shows the selected allergen name on the trigger', () => {
    stubSearch()

    render(<AllergenFilter value={{ id: 'a1', name: 'Pollen' }} onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: /Allergen/ })).toHaveTextContent('Pollen')
  })

  it('reports the picked allergen', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    stubSearch()

    render(<AllergenFilter value={null} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /Allergen/ }))
    await user.click(await screen.findByRole('option', { name: /Pollen/ }))

    expect(onChange).toHaveBeenCalledWith({ id: 'a1', name: 'Pollen' })
  })

  it('offers no clear row until something is selected', async () => {
    const user = userEvent.setup()
    stubSearch()

    render(<AllergenFilter value={null} onChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /Allergen/ }))

    expect(screen.queryByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument()
  })

  it('clears the selection to null', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    stubSearch()

    render(<AllergenFilter value={{ id: 'a1', name: 'Pollen' }} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /Allergen/ }))
    await user.click(await screen.findByRole('button', { name: 'Clear selection' }))

    expect(onChange).toHaveBeenCalledWith(null)
  })
})
