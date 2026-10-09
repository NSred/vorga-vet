import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Table, type TableColumn } from '../Table/Table'
import { SearchInput } from './SearchInput'

interface Row {
  id: string
  name: string
}

const rows: Row[] = [
  { id: 'r1', name: 'Bunny' },
  { id: 'r2', name: 'Luna' },
]

const columns: TableColumn<Row>[] = [{ key: 'name', header: 'Name', render: (row) => row.name }]

function Page({ onOpen }: { onOpen: (row: Row) => void }) {
  const [search, setSearch] = useState('')
  return (
    <>
      <button type="button">Elsewhere</button>
      <SearchInput value={search} onChange={setSearch} placeholder="Search" />
      <Table columns={columns} rows={rows} getRowId={(row) => row.id} onRowClick={onOpen} />
    </>
  )
}

function bodyRows() {
  const [, ...rest] = screen.getAllByRole('row')
  return rest
}

describe('SearchInput keyboard', () => {
  it('takes focus on /', async () => {
    const user = userEvent.setup()
    render(<Page onOpen={vi.fn()} />)

    await user.keyboard('/')

    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveFocus()
  })

  it('lets / be typed once focused', async () => {
    const user = userEvent.setup()
    render(<Page onOpen={vi.fn()} />)

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), '064/1')

    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveValue('064/1')
  })

  it('moves to the first row on the down arrow and opens it with Enter', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    render(<Page onOpen={onOpen} />)

    await user.click(screen.getByRole('searchbox', { name: 'Search' }))
    await user.keyboard('{ArrowDown}')
    expect(bodyRows()[0]).toHaveFocus()
    await user.keyboard('{ArrowDown}{Enter}')

    expect(onOpen).toHaveBeenCalledWith(rows[1])
  })

  it('returns to the search from the first row on the up arrow', async () => {
    const user = userEvent.setup()
    render(<Page onOpen={vi.fn()} />)

    bodyRows()[0].focus()
    await user.keyboard('{ArrowUp}')

    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveFocus()
  })
})
