import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { FormDialog } from './FormDialog'

function Harness({
  onOpen,
  onSubmit,
  onOuterSubmit,
  onSecondary,
}: {
  onOpen: () => void
  onSubmit: () => void
  onOuterSubmit: () => void
  onSecondary?: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onOuterSubmit()
      }}
    >
      <button type="button" onClick={() => setOpen(true)}>
        open
      </button>
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="Name it"
        description="Give it a name."
        formId="name-form"
        submitLabel="Save"
        secondaryAction={onSecondary && { label: 'Skip', onClick: onSecondary }}
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
        onOpen={onOpen}
      >
        <input aria-label="Name" />
      </FormDialog>
    </form>
  )
}

describe('FormDialog', () => {
  it('runs onOpen every time it opens', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    render(<Harness onOpen={onOpen} onSubmit={vi.fn()} onOuterSubmit={vi.fn()} />)

    expect(onOpen).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'open' }))
    expect(onOpen).toHaveBeenCalledTimes(1)

    await user.click(
      within(screen.getByRole('dialog', { name: 'Name it' })).getByRole('button', {
        name: 'Cancel',
      }),
    )
    await user.click(screen.getByRole('button', { name: 'open' }))
    expect(onOpen).toHaveBeenCalledTimes(2)
  })

  it('submits its own form and never the form it is rendered inside', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const onOuterSubmit = vi.fn()
    render(<Harness onOpen={vi.fn()} onSubmit={onSubmit} onOuterSubmit={onOuterSubmit} />)

    await user.click(screen.getByRole('button', { name: 'open' }))
    const dialog = screen.getByRole('dialog', { name: 'Name it' })
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))
    await user.type(within(dialog).getByLabelText('Name'), 'Rex{Enter}')

    expect(onSubmit).toHaveBeenCalledTimes(2)
    expect(onOuterSubmit).not.toHaveBeenCalled()
  })

  it('offers a secondary action only when given one', async () => {
    const user = userEvent.setup()
    const onSecondary = vi.fn()
    const { unmount } = render(
      <Harness onOpen={vi.fn()} onSubmit={vi.fn()} onOuterSubmit={vi.fn()} />,
    )
    await user.click(screen.getByRole('button', { name: 'open' }))
    expect(screen.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument()
    unmount()

    render(
      <Harness
        onOpen={vi.fn()}
        onSubmit={vi.fn()}
        onOuterSubmit={vi.fn()}
        onSecondary={onSecondary}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'open' }))
    await user.click(screen.getByRole('button', { name: 'Skip' }))
    expect(onSecondary).toHaveBeenCalledTimes(1)
  })
})
