import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from '../Modal/Modal'
import { Combobox, type ComboboxOption, type ComboboxProps } from './Combobox'

const options: ComboboxOption[] = [
  { id: '1', label: 'Subić Vladimir', hint: '060/7301103' },
  { id: '2', label: 'Nikolić Milan', hint: '064/1123344' },
]

function setup(overrides: Partial<ComboboxProps> = {}) {
  const onSelect = vi.fn()
  const onQueryChange = vi.fn()
  const onCreate = vi.fn()

  render(
    <Combobox
      label="Owner"
      triggerText=""
      placeholder="Search owners…"
      query=""
      onQueryChange={onQueryChange}
      options={options}
      onSelect={onSelect}
      onCreate={onCreate}
      createLabel="Create owner"
      {...overrides}
    />,
  )

  return { onSelect, onQueryChange, onCreate }
}

describe('Combobox', () => {
  it('lists options after the popover opens', async () => {
    const user = userEvent.setup()
    setup()

    await user.click(screen.getByRole('button', { name: /Owner/ }))

    expect(await screen.findByText('Subić Vladimir')).toBeInTheDocument()
    expect(screen.getByText('Nikolić Milan')).toBeInTheDocument()
  })

  it('calls onSelect with the clicked option', async () => {
    const user = userEvent.setup()
    const { onSelect } = setup()

    await user.click(screen.getByRole('button', { name: /Owner/ }))
    await user.click(await screen.findByText('Nikolić Milan'))

    expect(onSelect).toHaveBeenCalledWith(options[1])
  })

  it('shows the create row only when the query is not empty', async () => {
    const user = userEvent.setup()
    setup({ query: '' })

    await user.click(screen.getByRole('button', { name: /Owner/ }))

    expect(screen.queryByText(/Create owner/)).not.toBeInTheDocument()
  })

  it('calls onCreate with the trimmed query', async () => {
    const user = userEvent.setup()
    const { onCreate } = setup({ query: '  Bichon  ' })

    await user.click(screen.getByRole('button', { name: /Owner/ }))
    await user.click(await screen.findByText(/Create owner/))

    expect(onCreate).toHaveBeenCalledWith('Bichon')
  })

  it('selects the active option with the keyboard', async () => {
    const user = userEvent.setup()
    const { onSelect } = setup()

    await user.click(screen.getByRole('button', { name: /Owner/ }))
    await screen.findByText('Subić Vladimir')
    await user.keyboard('{ArrowDown}{Enter}')

    expect(onSelect).toHaveBeenCalledWith(options[1])
  })

  it('shows the loading state instead of options', async () => {
    const user = userEvent.setup()
    setup({ isLoading: true })

    await user.click(screen.getByRole('button', { name: /Owner/ }))

    expect(await screen.findByText('Searching…')).toBeInTheDocument()
    expect(screen.queryByText('Subić Vladimir')).not.toBeInTheDocument()
  })

  it('shows the empty message when there are no options and nothing to create', async () => {
    const user = userEvent.setup()
    setup({ options: [], onCreate: undefined, emptyMessage: 'No owners found' })

    await user.click(screen.getByRole('button', { name: /Owner/ }))

    expect(await screen.findByText('No owners found')).toBeInTheDocument()
  })

  it('does not open when disabled', async () => {
    const user = userEvent.setup()
    setup({ disabled: true })

    await user.click(screen.getByRole('button', { name: /Owner/ }))

    expect(screen.queryByText('Subić Vladimir')).not.toBeInTheDocument()
  })

  it('asks for more when the list is scrolled to the end and more exist', async () => {
    const user = userEvent.setup()
    const onLoadMore = vi.fn()
    setup({ hasMore: true, onLoadMore })

    await user.click(screen.getByRole('button', { name: 'Owner' }))
    fireEvent.scroll(screen.getByRole('listbox', { name: 'Owner' }))

    expect(onLoadMore).toHaveBeenCalledTimes(1)
  })

  it('does not ask for more when everything is loaded or a page is loading', async () => {
    const user = userEvent.setup()
    const onLoadMore = vi.fn()
    setup({ hasMore: true, isLoadingMore: true, onLoadMore })

    await user.click(screen.getByRole('button', { name: 'Owner' }))
    fireEvent.scroll(screen.getByRole('listbox', { name: 'Owner' }))

    expect(onLoadMore).not.toHaveBeenCalled()
    expect(screen.getByText('Loading more…')).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(2)
  })

  it('asks for more when the keyboard reaches the last options', async () => {
    const user = userEvent.setup()
    const onLoadMore = vi.fn()
    setup({ hasMore: true, onLoadMore, onCreate: undefined })

    await user.click(screen.getByRole('button', { name: 'Owner' }))
    await user.keyboard('{ArrowDown}')

    expect(onLoadMore).toHaveBeenCalled()
  })
})

describe('Combobox inside a dialog', () => {
  function makeScrollable(list: HTMLElement) {
    list.style.overflowY = 'auto'
    Object.defineProperty(list, 'clientHeight', { configurable: true, value: 100 })
    Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 500 })
  }

  it('lets the mouse wheel scroll its list while the dialog locks the page', async () => {
    const user = userEvent.setup()
    render(
      <Modal open onOpenChange={vi.fn()} title="New patient" description="Pick an owner.">
        <Combobox
          label="Owner"
          triggerText=""
          query=""
          onQueryChange={vi.fn()}
          options={options}
          onSelect={vi.fn()}
        />
      </Modal>,
    )

    await user.click(screen.getByRole('button', { name: 'Owner' }))
    const list = await screen.findByRole('listbox', { name: 'Owner' })
    makeScrollable(list)

    const wheel = new WheelEvent('wheel', { deltaY: 40, bubbles: true, cancelable: true })
    within(list).getAllByRole('option')[0].dispatchEvent(wheel)

    expect(wheel.defaultPrevented).toBe(false)
  })
})
