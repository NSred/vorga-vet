import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TextField } from './TextField'

describe('TextField', () => {
  it('shows a unit after the input and keeps the input named by its label', () => {
    render(<TextField id="weight" label="Weight" suffix="kg" />)

    expect(screen.getByRole('textbox', { name: 'Weight' })).toBeInTheDocument()
    expect(screen.getByText('kg')).toBeInTheDocument()
  })

  it('names a required input with its asterisk', () => {
    render(<TextField id="vet" label="Vet *" />)

    expect(screen.getByRole('textbox', { name: 'Vet *' })).toBeInTheDocument()
  })

  it('names the input by its visible label', () => {
    render(<TextField id="name" label="Name" />)

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument()
  })

  it('keeps the name when the label is hidden', () => {
    render(<TextField id="name" label="Description of cost 1" hideLabel />)

    expect(screen.queryByText('Description of cost 1')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Description of cost 1' })).toBeInTheDocument()
  })

  it('lets a longer accessible name override the visible label', () => {
    render(<TextField id="qty" label="Qty" aria-label="Quantity of Synulox" />)

    expect(screen.getByRole('textbox', { name: 'Quantity of Synulox' })).toBeInTheDocument()
  })

  it('marks the input invalid without a message', () => {
    render(<TextField id="qty" label="Qty" invalid />)

    expect(screen.getByRole('textbox', { name: 'Qty' })).toHaveAttribute('aria-invalid', 'true')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows an error message and marks the input invalid', () => {
    render(<TextField id="qty" label="Qty" error="Enter a quantity" />)

    expect(screen.getByRole('textbox', { name: 'Qty' })).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a quantity')
  })
})
