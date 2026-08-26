import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DatePicker } from './DatePicker'

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(new Date(2026, 7, 26))
})

afterEach(() => {
  vi.useRealTimers()
})

function openCalendar(user: ReturnType<typeof userEvent.setup>) {
  return user.click(screen.getByLabelText('Date of birth'))
}

describe('DatePicker year view', () => {
  it('shows a page of years centred near the current one', async () => {
    const user = userEvent.setup()
    render(<DatePicker id="birthDate" label="Date of birth" onChange={vi.fn()} />)

    await openCalendar(user)
    await user.click(screen.getByRole('button', { name: '2026' }))

    expect(screen.getByText('2021 – 2032')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2021' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2032' })).toBeInTheDocument()
  })

  it('pages back twelve years at a time to reach much earlier years', async () => {
    const user = userEvent.setup()
    render(<DatePicker id="birthDate" label="Date of birth" onChange={vi.fn()} />)

    await openCalendar(user)
    await user.click(screen.getByRole('button', { name: '2026' }))
    await user.click(screen.getByRole('button', { name: 'Previous years' }))
    await user.click(screen.getByRole('button', { name: 'Previous years' }))

    expect(screen.getByText('1997 – 2008')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2000' })).toBeInTheDocument()
  })

  it('picking a year moves on to the month view for that year', async () => {
    const user = userEvent.setup()
    render(<DatePicker id="birthDate" label="Date of birth" onChange={vi.fn()} />)

    await openCalendar(user)
    await user.click(screen.getByRole('button', { name: '2026' }))
    await user.click(screen.getByRole('button', { name: 'Previous years' }))
    await user.click(screen.getByRole('button', { name: '2012' }))

    expect(screen.getByRole('button', { name: 'Aug' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2012' })).toBeInTheDocument()
  })

  it('selecting month then day yields the chosen year', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<DatePicker id="birthDate" label="Date of birth" onChange={onChange} />)

    await openCalendar(user)
    await user.click(screen.getByRole('button', { name: '2026' }))
    await user.click(screen.getByRole('button', { name: 'Previous years' }))
    await user.click(screen.getByRole('button', { name: '2012' }))
    await user.click(screen.getByRole('button', { name: 'Mar' }))
    await user.click(screen.getByRole('button', { name: '15.03.2012' }))

    expect(onChange).toHaveBeenCalledWith('2012-03-15')
  })

  it('clicking the month name still opens the month view', async () => {
    const user = userEvent.setup()
    render(<DatePicker id="birthDate" label="Date of birth" onChange={vi.fn()} />)

    await openCalendar(user)
    await user.click(screen.getByRole('button', { name: 'August' }))

    expect(screen.getByRole('button', { name: 'Jan' })).toBeInTheDocument()
  })
})

describe('DatePicker maxDate', () => {
  it('disables days after maxDate and keeps earlier ones enabled', async () => {
    const user = userEvent.setup()
    render(
      <DatePicker id="birthDate" label="Date of birth" onChange={vi.fn()} maxDate="2026-08-26" />,
    )

    await openCalendar(user)

    expect(screen.getByRole('button', { name: '25.08.2026' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '26.08.2026' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '27.08.2026' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '31.08.2026' })).toBeDisabled()
  })

  it('does not report a selection when a disabled day is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <DatePicker id="birthDate" label="Date of birth" onChange={onChange} maxDate="2026-08-26" />,
    )

    await openCalendar(user)
    await user.click(screen.getByRole('button', { name: '27.08.2026' }))

    expect(onChange).not.toHaveBeenCalled()
  })

  it('selects an allowed day', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <DatePicker id="birthDate" label="Date of birth" onChange={onChange} maxDate="2026-08-26" />,
    )

    await openCalendar(user)
    await user.click(screen.getByRole('button', { name: '10.08.2026' }))

    expect(onChange).toHaveBeenCalledWith('2026-08-10')
  })

  it('blocks navigating past the max month', async () => {
    const user = userEvent.setup()
    render(
      <DatePicker id="birthDate" label="Date of birth" onChange={vi.fn()} maxDate="2026-08-26" />,
    )

    await openCalendar(user)

    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeEnabled()
  })

  it('disables future months in the month view', async () => {
    const user = userEvent.setup()
    render(
      <DatePicker id="birthDate" label="Date of birth" onChange={vi.fn()} maxDate="2026-08-26" />,
    )

    await openCalendar(user)
    await user.click(screen.getByRole('button', { name: 'August' }))

    expect(screen.getByRole('button', { name: 'Aug' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Sep' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Dec' })).toBeDisabled()
  })

  it('disables years after maxDate in the year view', async () => {
    const user = userEvent.setup()
    render(
      <DatePicker id="birthDate" label="Date of birth" onChange={vi.fn()} maxDate="2026-08-26" />,
    )

    await openCalendar(user)
    await user.click(screen.getByRole('button', { name: '2026' }))

    expect(screen.getByRole('button', { name: '2025' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '2026' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '2027' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next years' })).toBeDisabled()
  })

  it('leaves every day selectable when no maxDate is given', async () => {
    const user = userEvent.setup()
    render(<DatePicker id="birthDate" label="Date of birth" onChange={vi.fn()} />)

    await openCalendar(user)

    expect(screen.getByRole('button', { name: '31.08.2026' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Next month' })).toBeEnabled()
  })
})
