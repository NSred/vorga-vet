import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button shortcut', () => {
  it('clicks itself on its key and keeps its accessible name', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button shortcut="n" onClick={onClick}>
        ＋ New patient
      </Button>,
    )

    await user.keyboard('n')

    const button = screen.getByRole('button', { name: '＋ New patient' })
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(button).toHaveAttribute('aria-keyshortcuts', 'N')
  })

  it('ignores its key while disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button shortcut="n" onClick={onClick} disabled>
        ＋ New patient
      </Button>,
    )

    await user.keyboard('n')

    expect(onClick).not.toHaveBeenCalled()
  })

  it('has no hint without a shortcut', () => {
    render(<Button>Save</Button>)

    expect(screen.getByRole('button', { name: 'Save' })).not.toHaveAttribute('aria-keyshortcuts')
  })
})
