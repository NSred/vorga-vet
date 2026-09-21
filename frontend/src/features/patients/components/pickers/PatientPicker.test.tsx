import { screen } from '@testing-library/react'
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

    expect(searchSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }), 1, 10)
    expect(onChange).toHaveBeenCalledWith(luna)
  })
})
