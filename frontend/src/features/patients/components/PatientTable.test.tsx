import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PatientTable } from './PatientTable'
import type { PatientListItem } from '../types'

const active: PatientListItem = {
  id: 'p1',
  cardNumber: 'D26-04821',
  name: 'Rex',
  species: 'dog',
  breedName: 'Pug',
  sex: 'male',
  isDeleted: false,
  ownerName: 'Marko Marković',
  phoneNumber: '060/1234567',
  city: 'Novi Sad',
  allergies: [],
}

const deleted: PatientListItem = { ...active, id: 'p2', name: 'Maza', isDeleted: true }

function renderTable(patients: PatientListItem[], onRowClick = vi.fn()) {
  render(
    <PatientTable
      patients={patients}
      isLoading={false}
      page={1}
      pageSize={10}
      totalCount={patients.length}
      hasFilters={false}
      onPageChange={vi.fn()}
      onPageSizeChange={vi.fn()}
      onRowClick={onRowClick}
    />,
  )
  return onRowClick
}

function rowFor(name: string): HTMLElement {
  return screen.getByText(name).closest('tr') as HTMLElement
}

describe('PatientTable deleted rows', () => {
  it('marks a deleted row and leaves an active one alone', () => {
    renderTable([active, deleted])

    const deletedRow = rowFor('Maza')
    const activeRow = rowFor('Rex')

    expect(deletedRow.className).toMatch(/deletedRow/)
    expect(activeRow.className).not.toMatch(/deletedRow/)
  })

  it('keeps the clickable class alongside the deleted class', () => {
    renderTable([deleted])

    expect(rowFor('Maza').className).toMatch(/clickableRow/)
  })

  it('still opens a deleted patient when its row is clicked', async () => {
    const user = userEvent.setup()
    const onRowClick = renderTable([deleted])

    await user.click(screen.getByText('Maza'))

    expect(onRowClick).toHaveBeenCalledWith(deleted)
  })
})

describe('PatientTable paging', () => {
  it('derives the page count from totalCount, not the rows on screen', () => {
    render(
      <PatientTable
        patients={[active]}
        isLoading={false}
        page={1}
        pageSize={10}
        totalCount={25}
        hasFilters={false}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        onRowClick={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument()
  })
})

describe('PatientTable empty states', () => {
  it('distinguishes an empty database from an empty filter result', () => {
    const { unmount } = render(
      <PatientTable
        patients={[]}
        isLoading={false}
        page={1}
        pageSize={10}
        totalCount={0}
        hasFilters={false}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        onRowClick={vi.fn()}
      />,
    )
    expect(screen.getByText('No patients yet.')).toBeInTheDocument()
    unmount()

    render(
      <PatientTable
        patients={[]}
        isLoading={false}
        page={1}
        pageSize={10}
        totalCount={0}
        hasFilters
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        onRowClick={vi.fn()}
      />,
    )
    expect(screen.getByText('No patients match your filters.')).toBeInTheDocument()
  })
})
