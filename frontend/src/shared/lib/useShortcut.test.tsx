import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { useShortcut } from './useShortcut'

function Harness({ onFire, enabled = true }: { onFire: () => void; enabled?: boolean }) {
  useShortcut('n', onFire, enabled)
  return (
    <>
      <input aria-label="Name" />
      <textarea aria-label="Note" />
    </>
  )
}

describe('useShortcut', () => {
  it('fires on the key in either case', async () => {
    const user = userEvent.setup()
    const onFire = vi.fn()
    render(<Harness onFire={onFire} />)

    await user.keyboard('n')
    await user.keyboard('N')

    expect(onFire).toHaveBeenCalledTimes(2)
  })

  it('ignores the key while typing in a field', async () => {
    const user = userEvent.setup()
    const onFire = vi.fn()
    render(<Harness onFire={onFire} />)

    await user.type(screen.getByLabelText('Name'), 'n')
    await user.type(screen.getByLabelText('Note'), 'n')

    expect(onFire).not.toHaveBeenCalled()
  })

  it('ignores the key with a modifier', async () => {
    const user = userEvent.setup()
    const onFire = vi.fn()
    render(<Harness onFire={onFire} />)

    await user.keyboard('{Control>}n{/Control}{Alt>}n{/Alt}{Meta>}n{/Meta}')

    expect(onFire).not.toHaveBeenCalled()
  })

  it('ignores the key while a dialog is open', async () => {
    const user = userEvent.setup()
    const onFire = vi.fn()
    render(
      <>
        <Harness onFire={onFire} />
        <div role="dialog" aria-label="Panel" />
      </>,
    )

    await user.keyboard('n')

    expect(onFire).not.toHaveBeenCalled()
  })

  it('does nothing when disabled', async () => {
    const user = userEvent.setup()
    const onFire = vi.fn()
    render(<Harness onFire={onFire} enabled={false} />)

    await user.keyboard('n')

    expect(onFire).not.toHaveBeenCalled()
  })
})
