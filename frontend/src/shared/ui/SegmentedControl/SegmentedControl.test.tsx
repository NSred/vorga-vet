import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SegmentedControl } from './SegmentedControl'

const OPTIONS = [
  { value: 'daily', label: 'Daily report' },
  { value: 'unpaid', label: 'Unpaid exams', count: 2 },
] as const

describe('SegmentedControl', () => {
  it('shows a count beside an option that has one', () => {
    render(<SegmentedControl value="daily" onChange={vi.fn()} options={OPTIONS} />)

    expect(screen.getByRole('button', { name: 'Unpaid exams 2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Daily report' })).toBeInTheDocument()
  })

  it('marks the selected option and reports a new choice', async () => {
    const onChange = vi.fn()
    render(<SegmentedControl value="daily" onChange={onChange} options={OPTIONS} />)

    expect(screen.getByRole('button', { name: 'Daily report' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Unpaid exams 2' }))

    expect(onChange).toHaveBeenCalledWith('unpaid')
  })
})
