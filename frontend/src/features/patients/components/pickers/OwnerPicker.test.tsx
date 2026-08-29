import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { OwnerPicker } from './OwnerPicker'
import * as ownersApi from '../../api/ownersApi'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('OwnerPicker', () => {
  it('shows the selected owner name and phone', () => {
    vi.spyOn(ownersApi, 'searchOwners').mockResolvedValue([])

    render(
      <OwnerPicker
        value={{ id: '1', firstName: 'Vladimir', lastName: 'Subić', phoneNumber: '060/7301103' }}
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /Owner/ })).toHaveTextContent('Subić Vladimir')
    expect(screen.getByText('060/7301103')).toBeInTheDocument()
  })

  it('selects an owner from the search results', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    vi.spyOn(ownersApi, 'searchOwners').mockResolvedValue([
      { id: '2', firstName: 'Milan', lastName: 'Nikolić', phoneNumber: '064/1123344' },
    ])

    render(<OwnerPicker value={null} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /Owner/ }))
    await user.click(await screen.findByText('Nikolić Milan'))

    expect(onChange).toHaveBeenCalledWith({
      id: '2',
      firstName: 'Milan',
      lastName: 'Nikolić',
      phoneNumber: '064/1123344',
    })
  })

  it('creates an owner and selects it without refetching', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    vi.spyOn(ownersApi, 'searchOwners').mockResolvedValue([])
    const createSpy = vi.spyOn(ownersApi, 'createOwner').mockResolvedValue('new-owner-id')

    render(<OwnerPicker value={null} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /Owner/ }))
    await user.type(screen.getByLabelText('Search Owner *'), 'Petrović')
    await user.click(await screen.findByText(/Create owner/))

    await user.type(screen.getByLabelText('First name *'), 'Ana')
    await user.type(screen.getByLabelText('Last name *'), 'Petrović')
    await user.type(screen.getByLabelText('Phone *'), '062/8890021')
    await user.type(screen.getByLabelText('Address *'), 'Zmaj Jovina 4')
    await user.type(screen.getByLabelText('City *'), 'Novi Sad')
    await user.click(screen.getByRole('button', { name: 'Create owner' }))

    expect(createSpy).toHaveBeenCalledWith({
      firstName: 'Ana',
      lastName: 'Petrović',
      phoneNumber: '062/8890021',
      address: 'Zmaj Jovina 4',
      city: 'Novi Sad',
    })
    expect(onChange).toHaveBeenCalledWith({
      id: 'new-owner-id',
      firstName: 'Ana',
      lastName: 'Petrović',
      phoneNumber: '062/8890021',
    })
  })

  it('keeps the dialog open and shows the error when create fails', async () => {
    const user = userEvent.setup()
    vi.spyOn(ownersApi, 'searchOwners').mockResolvedValue([])
    vi.spyOn(ownersApi, 'createOwner').mockRejectedValue(new Error('Server exploded'))

    render(<OwnerPicker value={null} onChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /Owner/ }))
    await user.type(screen.getByLabelText('Search Owner *'), 'Ana')
    await user.click(await screen.findByText(/Create owner/))

    await user.type(screen.getByLabelText('First name *'), 'Ana')
    await user.type(screen.getByLabelText('Last name *'), 'Petrović')
    await user.type(screen.getByLabelText('Phone *'), '062')
    await user.type(screen.getByLabelText('Address *'), 'Zmaj Jovina 4')
    await user.type(screen.getByLabelText('City *'), 'Novi Sad')
    await user.click(screen.getByRole('button', { name: 'Create owner' }))

    expect(await screen.findByText('Server exploded')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
