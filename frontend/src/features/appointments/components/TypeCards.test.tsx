import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TypeCards } from './TypeCards'

describe('TypeCards', () => {
  it('shows each type with its length and reports a choice', async () => {
    const onChange = vi.fn()
    render(<TypeCards value="checkup" onChange={onChange} types={['checkup', 'surgery']} />)

    expect(screen.getByRole('radio', { name: 'Checkup 30 min' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await userEvent.click(screen.getByRole('radio', { name: 'Surgery Choose a duration' }))

    expect(onChange).toHaveBeenCalledWith('surgery')
  })
})
