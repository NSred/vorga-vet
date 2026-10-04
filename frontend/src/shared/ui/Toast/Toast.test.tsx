import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ToastProvider } from './ToastProvider'
import { useToast } from './useToast'

function Trigger() {
  const { showToast } = useToast()
  return (
    <button type="button" onClick={() => showToast({ tone: 'success', title: 'Patient created' })}>
      fire
    </button>
  )
}

describe('Toast', () => {
  it('shows a toast when showToast is called', async () => {
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    )

    expect(screen.queryByText('Patient created')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'fire' }))

    expect(await screen.findByText('Patient created')).toBeInTheDocument()
  })

  it('throws a helpful error when used outside the provider', () => {
    expect(() => render(<Trigger />)).toThrow(/ToastProvider/)
  })
})
