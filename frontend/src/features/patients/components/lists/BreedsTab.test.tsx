import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import * as allergensApi from '../../api/allergensApi'
import * as breedsApi from '../../api/breedsApi'
import { AllergensTab } from './AllergensTab'
import { BreedsTab } from './BreedsTab'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('BreedsTab', () => {
  it('asks the real endpoint per species and search', async () => {
    const searchSpy = vi
      .spyOn(breedsApi, 'searchBreeds')
      .mockImplementation(async (species) =>
        species === 'cat' ? [{ id: 'b2', name: 'Persian' }] : [{ id: 'b1', name: 'Beagle' }],
      )
    const user = userEvent.setup()
    render(<BreedsTab />)

    expect(await screen.findByText('Beagle')).toBeInTheDocument()
    expect(searchSpy).toHaveBeenCalledWith('dog', '')

    await user.click(screen.getByRole('button', { name: 'Cat' }))
    expect(await screen.findByText('Persian')).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('Search breeds'), 'per')
    await waitFor(() => expect(searchSpy).toHaveBeenCalledWith('cat', 'per'))
  })

  it('says when only the first 20 are shown', async () => {
    vi.spyOn(breedsApi, 'searchBreeds').mockResolvedValue(
      Array.from({ length: 20 }, (_, index) => ({ id: `b${index}`, name: `Breed ${index}` })),
    )
    render(<BreedsTab />)

    expect(
      await screen.findByText('Showing the first 20. Search to narrow the list.'),
    ).toBeInTheDocument()
  })

  it('adds a breed for the chosen species and shows it', async () => {
    const searchSpy = vi.spyOn(breedsApi, 'searchBreeds').mockResolvedValue([])
    const createSpy = vi.spyOn(breedsApi, 'createBreed').mockResolvedValue('b9')
    const user = userEvent.setup()
    render(<BreedsTab />)
    await screen.findByText('No breeds for this species yet.')

    searchSpy.mockResolvedValue([{ id: 'b9', name: 'Vizsla' }])
    await user.click(screen.getByRole('button', { name: '＋ New breed' }))
    const dialog = await screen.findByRole('dialog', { name: 'New breed' })
    await user.type(within(dialog).getByLabelText('Breed name *'), 'Vizsla')
    await user.click(within(dialog).getByRole('button', { name: 'Create breed' }))

    expect(createSpy).toHaveBeenCalledWith({ name: 'Vizsla', species: 'dog' })
    expect(await screen.findByText('Vizsla is on the breed list')).toBeInTheDocument()
    const list = await screen.findByRole('list', { name: 'Breeds' })
    expect(within(list).getByText('Vizsla')).toBeInTheDocument()
  })
})

describe('AllergensTab', () => {
  it('lists allergens from the real endpoint', async () => {
    vi.spyOn(allergensApi, 'searchAllergens').mockResolvedValue([{ id: 'a1', name: 'Penicilin' }])
    render(<AllergensTab />)

    expect(await screen.findByText('Penicilin')).toBeInTheDocument()
  })
})
