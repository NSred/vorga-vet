import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SegmentedControl } from './SegmentedControl'

const OPTIONS = [
  { value: 'daily', label: 'Daily report' },
  { value: 'unpaid', label: 'Unpaid exams' },
] as const

describe('SegmentedControl', () => {
  it('marks the selected option and reports a new choice', async () => {
    const onChange = vi.fn()
    render(<SegmentedControl value="daily" onChange={onChange} options={OPTIONS} />)

    expect(screen.getByRole('button', { name: 'Daily report' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Unpaid exams' }))

    expect(onChange).toHaveBeenCalledWith('unpaid')
  })

  it('names a labelled control by its label', () => {
    render(<SegmentedControl label="Report" value="daily" onChange={vi.fn()} options={OPTIONS} />)

    const group = screen.getByRole('group', { name: 'Report' })
    expect(within(group).getAllByRole('button')).toHaveLength(2)
  })
})
