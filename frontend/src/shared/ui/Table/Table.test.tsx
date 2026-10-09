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

describe('Table keyboard rows', () => {
  const threeRows: Row[] = [
    { id: 'r1', name: 'Bunny', owner: 'Stefan', city: 'Niš' },
    { id: 'r2', name: 'Luna', owner: 'Ana', city: 'Novi Sad' },
    { id: 'r3', name: 'Rex', owner: 'Milan', city: 'Beograd' },
  ]

  const actionColumns: TableColumn<Row>[] = [
    ...plainColumns,
    {
      key: 'action',
      header: '',
      render: (row) => (
        <button type="button" onClick={(event) => event.stopPropagation()}>
          Retire {row.name}
        </button>
      ),
    },
  ]

  function renderRows(columns = plainColumns) {
    const onRowClick = vi.fn()
    render(
      <Table
        columns={columns}
        rows={threeRows}
        getRowId={(row) => row.id}
        onRowClick={onRowClick}
      />,
    )
    const [, ...bodyRows] = screen.getAllByRole('row')
    return { onRowClick, bodyRows }
  }

  it('leaves rows out of the tab order when they do not open anything', () => {
    render(<Table columns={plainColumns} rows={threeRows} getRowId={(row) => row.id} />)

    const [, firstRow] = screen.getAllByRole('row')
    expect(firstRow).not.toHaveAttribute('tabindex')
  })

  it('reaches the first row with Tab and opens it with Enter', async () => {
    const user = userEvent.setup()
    const { onRowClick, bodyRows } = renderRows()

    await user.tab()
    expect(bodyRows[0]).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(onRowClick).toHaveBeenCalledWith(threeRows[0])
  })

  it('opens a row with Space', async () => {
    const user = userEvent.setup()
    const { onRowClick, bodyRows } = renderRows()

    bodyRows[1].focus()
    await user.keyboard(' ')

    expect(onRowClick).toHaveBeenCalledWith(threeRows[1])
  })

  it('moves between rows with the up and down arrows and stops at the ends', async () => {
    const user = userEvent.setup()
    const { onRowClick, bodyRows } = renderRows()

    bodyRows[0].focus()
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}')
    expect(bodyRows[2]).toHaveFocus()
    await user.keyboard('{ArrowUp}')
    expect(bodyRows[1]).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(onRowClick).toHaveBeenCalledWith(threeRows[1])
  })

  it('leaves Enter on a button inside a row to that button', async () => {
    const user = userEvent.setup()
    const { onRowClick } = renderRows(actionColumns)

    screen.getByRole('button', { name: 'Retire Luna' }).focus()
    await user.keyboard('{Enter}')

    expect(onRowClick).not.toHaveBeenCalled()
  })
})
