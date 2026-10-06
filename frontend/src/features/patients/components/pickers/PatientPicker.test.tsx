import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { PatientPicker } from './PatientPicker'
import * as patientsApi from '../../api/patientsApi'
import type { PatientListItem } from '../../types'

const luna: PatientListItem = {
  id: 'p1',
  cardNumber: 'C26-00001',
  name: 'Luna',
  species: 'cat',
  breedName: 'Chartreux',
  sex: 'female',
  isDeleted: false,
  ownerName: 'Ana Petrović',
  phoneNumber: '062/8890021',
  city: 'Novi Sad',
  allergies: [],
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PatientPicker', () => {
  it('shows the selected patient with its owner', () => {
    vi.spyOn(patientsApi, 'getPatients').mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 10,
    })

    render(<PatientPicker value={luna} onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: /Patient/ })).toHaveTextContent('Luna · Ana Petrović')
  })

  it('fetches nothing until the dropdown is opened', async () => {
    const user = userEvent.setup()
    const searchSpy = vi.spyOn(patientsApi, 'getPatients').mockResolvedValue({
      items: [luna],
      totalCount: 1,
      page: 1,
      pageSize: 15,
    })

    render(<PatientPicker value={null} onChange={vi.fn()} />)
    await new Promise((resolve) => setTimeout(resolve, 350))
    expect(searchSpy).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /Patient/ }))

    expect(await screen.findByText('Luna · Ana Petrović')).toBeInTheDocument()
    expect(searchSpy).toHaveBeenCalledTimes(1)
  })

  it('searches active patients and selects one', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const searchSpy = vi.spyOn(patientsApi, 'getPatients').mockResolvedValue({
      items: [luna],
      totalCount: 1,
      page: 1,
      pageSize: 10,
    })

    render(<PatientPicker value={null} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /Patient/ }))
    await user.click(await screen.findByText('Luna · Ana Petrović'))

    expect(searchSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }), 1, 15)
    expect(onChange).toHaveBeenCalledWith(luna)
  })

  it('loads the next page when the list is scrolled to the end', async () => {
    const user = userEvent.setup()
    const firstPage = Array.from({ length: 15 }, (_, index) => ({
      ...luna,
      id: `p${index}`,
      name: `Animal ${String(index).padStart(2, '0')}`,
    }))
    const newDog = { ...luna, id: 'p-new', name: 'Novi ker', ownerName: 'Nenad Sone' }
    const searchSpy = vi
      .spyOn(patientsApi, 'getPatients')
      .mockImplementation(async (_filters, page, pageSize) => ({
        items: page === 1 ? firstPage : [newDog],
        totalCount: 16,
        page,
        pageSize,
      }))

    render(<PatientPicker value={null} onChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /Patient/ }))
    await screen.findByText('Animal 14 · Ana Petrović')
    expect(screen.queryByText('Novi ker · Nenad Sone')).not.toBeInTheDocument()

    fireEvent.scroll(screen.getByRole('listbox', { name: 'Patient' }))

    expect(await screen.findByText('Novi ker · Nenad Sone')).toBeInTheDocument()
    expect(searchSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }), 2, 15)
    expect(screen.getAllByRole('option')).toHaveLength(16)

    fireEvent.scroll(screen.getByRole('listbox', { name: 'Patient' }))
    expect(searchSpy).toHaveBeenCalledTimes(2)
  })
})
