import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { PriceListItem } from '../types'
import { PriceListTable } from './PriceListTable'

const items: PriceListItem[] = [
  { id: 'm1', kind: 'medication', name: 'Otifree', price: 1600, unit: 'boca', isActive: true },
  { id: 'm2', kind: 'medication', name: 'Rabisin', price: 900, isActive: false },
]

function renderTable(overrides: Partial<Parameters<typeof PriceListTable>[0]> = {}) {
  const props = {
    kind: 'medication' as const,
    items,
    isLoading: false,
    page: 1,
    pageSize: 25,
    totalCount: items.length,
    hasSearch: false,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
    onRowClick: vi.fn(),
    ...overrides,
  }
  render(<PriceListTable {...props} />)
  return props
}

describe('PriceListTable', () => {
  it('shows name, unit and formatted price, and marks retired items', () => {
    renderTable()

    expect(screen.getByRole('columnheader', { name: 'Unit' })).toBeInTheDocument()
    expect(screen.getByText('1.600,00 RSD')).toBeInTheDocument()
    expect(screen.getByText('boca')).toBeInTheDocument()
    expect(screen.getByText('Retired')).toBeInTheDocument()
  })

  it('has no unit column for services', () => {
    renderTable({ kind: 'service', items: [{ ...items[0], kind: 'service', unit: undefined }] })

    expect(screen.queryByRole('columnheader', { name: 'Unit' })).not.toBeInTheDocument()
  })

  it('opens an item on click', async () => {
    const user = userEvent.setup()
    const props = renderTable()

    await user.click(screen.getByText('Otifree'))

    expect(props.onRowClick).toHaveBeenCalledWith(items[0])
  })

  it('tells an empty search apart from an empty list', () => {
    renderTable({ items: [], totalCount: 0, hasSearch: true })
    expect(screen.getByText('No medications match your search.')).toBeInTheDocument()
  })
})
