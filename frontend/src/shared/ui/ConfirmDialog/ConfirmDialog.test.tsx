import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog'

function renderDialog(overrides: Partial<ConfirmDialogProps> = {}) {
  const props: ConfirmDialogProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: 'Delete record?',
    description: 'This cannot be undone.',
    confirmLabel: 'Delete',
    onConfirm: vi.fn(),
    ...overrides,
  }
  render(<ConfirmDialog {...props} />)

  return props
}

describe('ConfirmDialog', () => {
  it('calls onConfirm from the confirm button', async () => {
    const props = renderDialog()

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(props.onConfirm).toHaveBeenCalledTimes(1)
  })

  it('closes from Cancel without confirming', async () => {
    const props = renderDialog()

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(props.onOpenChange).toHaveBeenCalledWith(false)
    expect(props.onConfirm).not.toHaveBeenCalled()
  })

  it('renders its children above the footer', () => {
    renderDialog({ children: <textarea aria-label="Reason" /> })

    expect(screen.getByRole('textbox', { name: 'Reason' })).toBeInTheDocument()
  })

  it('disables both buttons while pending', () => {
    renderDialog({ isPending: true })

    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })
})
