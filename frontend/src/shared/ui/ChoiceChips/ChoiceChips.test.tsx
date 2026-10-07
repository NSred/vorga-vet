import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ChoiceChips } from './ChoiceChips'

const OPTIONS = [
  { value: 'dog', label: '🐶 Dog' },
  { value: 'cat', label: '🐱 Cat' },
] as const

describe('ChoiceChips', () => {
  it('names the group by its label and marks the chosen chip', () => {
    render(<ChoiceChips label="Species" value="dog" options={OPTIONS} onChange={vi.fn()} />)

    expect(screen.getByRole('radiogroup', { name: 'Species' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '🐶 Dog' })).toHaveAttribute('aria-checked', 'true')
  })

  it('reports a new choice', async () => {
    const onChange = vi.fn()
    render(<ChoiceChips label="Species" value="dog" options={OPTIONS} onChange={onChange} />)

    await userEvent.click(screen.getByRole('radio', { name: '🐱 Cat' }))

    expect(onChange).toHaveBeenCalledWith('cat')
  })
})
