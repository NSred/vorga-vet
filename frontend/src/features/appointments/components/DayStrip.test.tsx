import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DayStrip } from './DayStrip'

describe('DayStrip', () => {
  it('shows the week of the date, Monday first, with the date selected', () => {
    render(<DayStrip date="2026-10-07" onSelect={vi.fn()} />)

    const days = screen.getAllByRole('button')
    expect(days).toHaveLength(7)
    expect(days[0]).toHaveAccessibleName('05.10.2026')
    expect(screen.getByRole('button', { name: '07.10.2026' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('names the days that have visits and reports a tap', async () => {
    const onSelect = vi.fn()
    render(<DayStrip date="2026-10-07" onSelect={onSelect} counts={new Map([['2026-10-09', 2]])} />)

    await userEvent.click(screen.getByRole('button', { name: '09.10.2026, 2 appointments' }))

    expect(onSelect).toHaveBeenCalledWith('2026-10-09')
  })
})
