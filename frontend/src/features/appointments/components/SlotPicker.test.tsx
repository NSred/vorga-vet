import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SlotPicker } from './SlotPicker'

const OPTIONS = [
  { value: 's1', label: '07:00', disabled: false, isMine: false },
  { value: 's2', label: '07:30', disabled: true, isMine: false },
  { value: 's3', label: '08:00', disabled: true, isMine: true },
]

describe('SlotPicker', () => {
  it('offers free slots and shows taken and own ones disabled', () => {
    render(<SlotPicker label="Start time *" options={OPTIONS} value="" onChange={vi.fn()} />)

    expect(screen.getByRole('radiogroup', { name: 'Start time *' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '07:00' })).toBeEnabled()
    expect(screen.getByRole('radio', { name: '07:30, taken' })).toBeDisabled()
    expect(screen.getByRole('radio', { name: '08:00' })).toBeDisabled()
  })

  it('marks the chosen slot and reports a new choice', async () => {
    const onChange = vi.fn()
    render(<SlotPicker label="Start time *" options={OPTIONS} value="s1" onChange={onChange} />)

    expect(screen.getByRole('radio', { name: '07:00' })).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(screen.getByRole('radio', { name: '07:00' }))

    expect(onChange).toHaveBeenCalledWith('s1')
  })
})
