import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CenteredPanel } from './CenteredPanel'

describe('CenteredPanel', () => {
  it('shows a title, subtitle, body and footer, named by its title', () => {
    render(
      <CenteredPanel
        open
        onOpenChange={vi.fn()}
        title="Visit history"
        subtitle="All visits"
        footer={<button type="button">Done</button>}
      >
        <p>Body</p>
      </CenteredPanel>,
    )

    const dialog = screen.getByRole('dialog', { name: 'Visit history' })
    expect(dialog).toHaveTextContent('All visits')
    expect(dialog).toHaveTextContent('Body')
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument()
  })

  it('takes a custom header with its own accessible name and size', () => {
    render(
      <CenteredPanel
        open
        onOpenChange={vi.fn()}
        size="wide"
        ariaLabel="Visit history for Luna"
        header={<span>Luna</span>}
      >
        <p>Body</p>
      </CenteredPanel>,
    )

    const dialog = screen.getByRole('dialog', { name: 'Visit history for Luna' })
    expect(dialog).toHaveTextContent('Luna')
    expect(dialog.className).toMatch(/wide/)
  })

  it('asks to close on Escape and on the close button', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <CenteredPanel open onOpenChange={onOpenChange} title="Visit history">
        <p>Body</p>
      </CenteredPanel>,
    )

    await user.keyboard('{Escape}')
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    onOpenChange.mockClear()

    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
