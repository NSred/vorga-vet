import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EntityHeader } from './EntityHeader'

describe('EntityHeader', () => {
  it('shows the eyebrow, title, subtitle and chips it is given', () => {
    render(
      <EntityHeader
        eyebrow="O25-10010"
        avatar="🐾"
        title="Bunny"
        subtitle="Holland Lop Rabbit · 8 yrs"
        chips={<span>Active</span>}
      />,
    )

    expect(screen.getByText('O25-10010')).toBeInTheDocument()
    expect(screen.getByText('Bunny')).toBeInTheDocument()
    expect(screen.getByText('Holland Lop Rabbit · 8 yrs')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('leaves out the parts it is not given', () => {
    const { container } = render(<EntityHeader title="11:00 – 12:30" />)

    expect(screen.getByText('11:00 – 12:30')).toBeInTheDocument()
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0)
  })
})
