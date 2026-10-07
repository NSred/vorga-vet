import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DetailSection } from './Details'

describe('DetailSection', () => {
  it('shows the count and the action beside the heading', () => {
    render(
      <DetailSection title="Vaccinations" count={2} action={<button type="button">Add</button>}>
        <p>list</p>
      </DetailSection>,
    )

    expect(screen.getByRole('heading', { name: 'Vaccinations' })).toBeInTheDocument()
    expect(screen.getByLabelText('2 Vaccinations')).toHaveTextContent('2')
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
  })

  it('renders an untitled section without a heading row', () => {
    const { container } = render(
      <DetailSection>
        <p>form</p>
      </DetailSection>,
    )

    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(container.querySelector('section')?.children).toHaveLength(1)
  })
})
