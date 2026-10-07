import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FieldLabel } from './FieldLabel'

describe('FieldLabel', () => {
  it('marks a required field with a separate asterisk and keeps the full name', () => {
    render(
      <>
        <FieldLabel text="Vet *" htmlFor="vet" />
        <input id="vet" />
      </>,
    )

    expect(screen.getByLabelText('Vet *')).toBeInTheDocument()
    expect(screen.getByText('*').tagName).toBe('SPAN')
  })

  it('leaves an optional label as plain text', () => {
    render(<FieldLabel text="Color" htmlFor="color" />)

    expect(screen.getByText('Color').tagName).toBe('LABEL')
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })
})
