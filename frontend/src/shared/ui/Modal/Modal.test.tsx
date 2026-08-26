import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from './Modal'

describe('Modal', () => {
  it('renders title, description, body and footer when open', () => {
    render(
      <Modal
        open
        onOpenChange={vi.fn()}
        title="New owner"
        description="Add a new owner."
        footer={<button type="button">Create</button>}
      >
        <p>body content</p>
      </Modal>,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('New owner')).toBeInTheDocument()
    expect(screen.getByText('Add a new owner.')).toBeInTheDocument()
    expect(screen.getByText('body content')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    render(
      <Modal open={false} onOpenChange={vi.fn()} title="New owner" description="Add a new owner.">
        <p>body content</p>
      </Modal>,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('calls onOpenChange(false) on Escape', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <Modal open onOpenChange={onOpenChange} title="New owner" description="Add a new owner.">
        <p>body content</p>
      </Modal>,
    )

    await user.keyboard('{Escape}')

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
