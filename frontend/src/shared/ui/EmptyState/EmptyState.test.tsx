import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('shows just the message when nothing else is given', () => {
    const { container } = render(<EmptyState message="No reminders." />)

    expect(screen.getByText('No reminders.')).toBeInTheDocument()
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull()
  })

  it('shows the icon and the hint when they are given', () => {
    render(<EmptyState message="No reminders." icon="🔔" hint="Schedule check-ups." />)

    expect(screen.getByText('🔔')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('Schedule check-ups.')).toBeInTheDocument()
  })
})
