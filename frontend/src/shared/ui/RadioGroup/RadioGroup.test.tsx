import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RadioGroup } from './RadioGroup'

const OPTIONS = [
  { value: 'dog', label: '🐶 Dog' },
  { value: 'cat', label: '🐱 Cat' },
  { value: 'bird', label: '🐦 Bird', disabled: true, ariaLabel: 'Bird, unavailable' },
] as const

describe('RadioGroup', () => {
  it('names the group by its label and marks the chosen option', () => {
    render(<RadioGroup label="Species" value="dog" options={OPTIONS} onChange={vi.fn()} />)

    expect(screen.getByRole('radiogroup', { name: 'Species' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '🐶 Dog' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: '🐱 Cat' })).toHaveAttribute('aria-checked', 'false')
  })

  it('reports a new choice and keeps a disabled option under its own name', async () => {
    const onChange = vi.fn()
    render(<RadioGroup label="Species" value="dog" options={OPTIONS} onChange={onChange} />)

    await userEvent.click(screen.getByRole('radio', { name: '🐱 Cat' }))

    expect(onChange).toHaveBeenCalledWith('cat')
    expect(screen.getByRole('radio', { name: 'Bird, unavailable' })).toBeDisabled()
  })

  it('shows an error and marks the group invalid', () => {
    render(
      <RadioGroup
        label="Species *"
        value="dog"
        options={OPTIONS}
        onChange={vi.fn()}
        error="Pick a species"
      />,
    )

    expect(screen.getByRole('radiogroup', { name: 'Species *' })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Pick a species')
  })

  it('shows a placeholder instead of the options', () => {
    render(
      <RadioGroup
        label="Species"
        value="dog"
        options={OPTIONS}
        onChange={vi.fn()}
        placeholder="Loading…"
      />,
    )

    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  })
})
