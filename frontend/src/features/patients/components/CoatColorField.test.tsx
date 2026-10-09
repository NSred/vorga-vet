import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { CoatColorField } from './CoatColorField'

function Harness({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial)
  return <CoatColorField id="color" value={value} onChange={setValue} />
}

describe('CoatColorField', () => {
  it('fills the name when a swatch is clicked and marks that swatch', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Ginger' }))

    expect(screen.getByLabelText('Color')).toHaveValue('Ginger')
    expect(screen.getByRole('button', { name: 'Ginger' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Black' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('marks the swatch for a typed name regardless of case', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByLabelText('Color'), 'tabby')

    expect(screen.getByRole('button', { name: 'Tabby' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('keeps free text and marks no swatch', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByLabelText('Color'), 'Brindle')

    expect(screen.getByLabelText('Color')).toHaveValue('Brindle')
    expect(screen.queryByRole('button', { pressed: true })).not.toBeInTheDocument()
  })

  it('keeps the swatches out of the tab order and suggests names while typing', () => {
    render(<Harness />)

    expect(screen.getByRole('button', { name: 'White' })).toHaveAttribute('tabindex', '-1')
    expect(screen.getByLabelText('Color')).toHaveAttribute('list', 'color-suggestions')
    expect(document.querySelectorAll('#color-suggestions option')).toHaveLength(12)
  })
})
