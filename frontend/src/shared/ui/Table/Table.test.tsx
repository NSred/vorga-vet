import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Table, type TableColumn } from './Table'

interface Row {
  id: string
  name: string
  owner: string
  city: string
}

const rows: Row[] = [{ id: 'r1', name: 'Bunny', owner: 'Stefan', city: 'Niš' }]

const plainColumns: TableColumn<Row>[] = [
  { key: 'name', header: 'Name', render: (row) => row.name },
  { key: 'owner', header: 'Owner', render: (row) => row.owner },
]

const cardColumns: TableColumn<Row>[] = [
  { key: 'name', header: 'Name', mobile: 'title', render: (row) => row.name },
  { key: 'owner', header: 'Owner', render: (row) => row.owner },
  { key: 'city', header: 'City', mobile: 'hidden', render: (row) => row.city },
]

describe('Table phone cards', () => {
  it('stays a plain table when no column asks for cards', () => {
    render(<Table columns={plainColumns} rows={rows} getRowId={(row) => row.id} />)

    expect(screen.getByRole('table')).not.toHaveAttribute('data-cards')
    expect(screen.getByRole('cell', { name: 'Bunny' })).not.toHaveAttribute('data-label')
  })

  it('labels every cell with its header when a column asks for cards', () => {
    render(<Table columns={cardColumns} rows={rows} getRowId={(row) => row.id} />)

    expect(screen.getByRole('table')).toHaveAttribute('data-cards')
    expect(screen.getByRole('cell', { name: 'Bunny' })).toHaveAttribute('data-mobile', 'title')
    expect(screen.getByRole('cell', { name: 'Stefan' })).toHaveAttribute('data-label', 'Owner')
    expect(screen.getByRole('cell', { name: 'Stefan' })).toHaveAttribute('data-mobile', 'detail')
  })

  it('still renders a column hidden on phones, for wider screens', () => {
    render(<Table columns={cardColumns} rows={rows} getRowId={(row) => row.id} />)

    expect(screen.getByRole('cell', { name: 'Niš' })).toHaveAttribute('data-mobile', 'hidden')
    expect(screen.getByRole('columnheader', { name: 'City' })).toBeInTheDocument()
  })

  it('opens the row when a card is clicked', async () => {
    const onRowClick = vi.fn()
    render(
      <Table
        columns={cardColumns}
        rows={rows}
        getRowId={(row) => row.id}
        onRowClick={onRowClick}
      />,
    )

    await userEvent.click(screen.getByRole('cell', { name: 'Stefan' }))

    expect(onRowClick).toHaveBeenCalledWith(rows[0])
  })

  it('labels loading cells so skeletons take the card shape', () => {
    render(<Table columns={cardColumns} rows={[]} getRowId={(row) => row.id} isLoading />)

    expect(screen.getAllByRole('cell')[1]).toHaveAttribute('data-label', 'Owner')
  })
})
