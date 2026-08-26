import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

describe('test setup', () => {
  it('renders into jsdom and applies jest-dom matchers', () => {
    render(<p>hello</p>)

    expect(screen.getByText('hello')).toBeInTheDocument()
  })
})
