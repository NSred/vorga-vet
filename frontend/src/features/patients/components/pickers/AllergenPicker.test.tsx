import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AllergenPicker } from './AllergenPicker'
import * as allergensApi from '../../api/allergensApi'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AllergenPicker', () => {
  it('adds a selected allergen to the existing selection', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    vi.spyOn(allergensApi, 'searchAllergens').mockResolvedValue([
      { id: 'a1', name: 'pollen' },
      { id: 'a2', name: 'food' },
    ])

    render(<AllergenPicker value={[{ id: 'a2', name: 'food' }]} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /Allergens/ }))
    await user.click(await screen.findByText('pollen'))

    expect(onChange).toHaveBeenCalledWith([
      { id: 'a2', name: 'food' },
      { id: 'a1', name: 'pollen' },
    ])
  })

  it('removes an allergen when its chip is dismissed', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    vi.spyOn(allergensApi, 'searchAllergens').mockResolvedValue([])

    render(
      <AllergenPicker
        value={[
          { id: 'a1', name: 'pollen' },
          { id: 'a2', name: 'food' },
        ]}
        onChange={onChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Remove pollen' }))

    expect(onChange).toHaveBeenCalledWith([{ id: 'a2', name: 'food' }])
  })

  it('does not add the same allergen twice', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    vi.spyOn(allergensApi, 'searchAllergens').mockResolvedValue([{ id: 'a1', name: 'pollen' }])

    render(<AllergenPicker value={[{ id: 'a1', name: 'pollen' }]} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /Allergens/ }))
    await user.click(await screen.findByRole('option', { name: /pollen/ }))

    expect(onChange).not.toHaveBeenCalled()
  })

  it('creates an allergen and appends it', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    vi.spyOn(allergensApi, 'searchAllergens').mockResolvedValue([])
    const createSpy = vi.spyOn(allergensApi, 'createAllergen').mockResolvedValue('a9')

    render(<AllergenPicker value={[]} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /Allergens/ }))
    await user.type(screen.getByLabelText('Search Allergens'), 'dust')
    await user.click(await screen.findByText(/Create allergen/))

    expect(screen.getByLabelText('Allergen name *')).toHaveValue('dust')

    await user.click(screen.getByRole('button', { name: 'Create allergen' }))

    expect(createSpy).toHaveBeenCalledWith({ name: 'dust' })
    expect(onChange).toHaveBeenCalledWith([{ id: 'a9', name: 'dust' }])
  })
})
