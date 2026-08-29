import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { BreedPicker } from './BreedPicker'
import * as breedsApi from '../../api/breedsApi'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('BreedPicker', () => {
  it('searches breeds scoped to the given species', async () => {
    const user = userEvent.setup()
    const searchSpy = vi
      .spyOn(breedsApi, 'searchBreeds')
      .mockResolvedValue([{ id: 'b1', name: 'Chartreux' }])

    render(<BreedPicker species="cat" value={null} onChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /Breed/ }))

    expect(await screen.findByText('Chartreux')).toBeInTheDocument()
    expect(searchSpy).toHaveBeenCalledWith('cat', '')
  })

  it('clears the selected breed when species changes', () => {
    vi.spyOn(breedsApi, 'searchBreeds').mockResolvedValue([])
    const onChange = vi.fn()

    const { rerender } = render(
      <BreedPicker species="dog" value={{ id: 'b1', name: 'Pug' }} onChange={onChange} />,
    )

    expect(onChange).not.toHaveBeenCalled()

    rerender(<BreedPicker species="cat" value={{ id: 'b1', name: 'Pug' }} onChange={onChange} />)

    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('creates a breed prefilled with the typed query and selects it', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    vi.spyOn(breedsApi, 'searchBreeds').mockResolvedValue([])
    const createSpy = vi.spyOn(breedsApi, 'createBreed').mockResolvedValue('new-breed-id')

    render(<BreedPicker species="dog" value={null} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /Breed/ }))
    await user.type(screen.getByLabelText('Search Breed *'), 'Bichon Frise')
    await user.click(await screen.findByText(/Create breed/))

    expect(screen.getByLabelText('Breed name *')).toHaveValue('Bichon Frise')

    await user.click(screen.getByRole('button', { name: 'Create breed' }))

    expect(createSpy).toHaveBeenCalledWith({ name: 'Bichon Frise', species: 'dog' })
    expect(onChange).toHaveBeenCalledWith({ id: 'new-breed-id', name: 'Bichon Frise' })
  })
})
