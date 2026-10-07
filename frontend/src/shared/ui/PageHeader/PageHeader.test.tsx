import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PageHeader } from './PageHeader'

describe('PageHeader', () => {
  it('puts the actions in the phone action bar by default', () => {
    render(<PageHeader title="Price list" actions={<button type="button">New service</button>} />)

    expect(screen.getByRole('button', { name: 'New service' }).parentElement).toHaveAttribute(
      'data-action-bar',
      'bar',
    )
  })

  it('keeps the actions where they are when asked', () => {
    render(
      <PageHeader
        title="Reports"
        mobileActions="inline"
        actions={<button type="button">Print</button>}
      />,
    )

    expect(screen.getByRole('button', { name: 'Print' }).parentElement).toHaveAttribute(
      'data-action-bar',
      'inline',
    )
  })

  it('renders no action area without actions', () => {
    const { container } = render(<PageHeader title="Lists" />)

    expect(container.querySelector('[data-action-bar]')).toBeNull()
  })
})
