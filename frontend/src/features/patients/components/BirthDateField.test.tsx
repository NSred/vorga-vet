import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BirthDateField } from './BirthDateField'

let latest: string | undefined

function Harness({ initial }: { initial?: string }) {
  const [value, setValue] = useState(initial)
  latest = value
  return (
    <>
      <BirthDateField
        id="birthDate"
        value={value}
        onChange={(next) => {
          latest = next
          setValue(next)
        }}
      />
      <button type="button" onClick={() => setValue('2020-05-01')}>
        Pick 1 May 2020
      </button>
    </>
  )
}

function ageInput(): HTMLInputElement {
  return screen.getByLabelText('Age') as HTMLInputElement
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-09T12:00:00'))
})

afterEach(() => {
  vi.useRealTimers()
  latest = undefined
})

describe('BirthDateField', () => {
  it('sets the date of birth to today minus the typed years', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(ageInput(), '3')

    expect(latest).toBe('2023-10-09')
    expect(screen.getByLabelText('Date of birth')).toHaveTextContent('09.10.2023')
  })

  it('shows the whole years of an existing date of birth', () => {
    render(<Harness initial="2023-08-01" />)

    expect(ageInput()).toHaveValue(3)
  })

  it('follows a date picked afterwards', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(ageInput(), '3')
    await user.click(screen.getByRole('button', { name: 'Pick 1 May 2020' }))

    expect(ageInput()).toHaveValue(6)
  })

  it('clears the date when the age is cleared', async () => {
    const user = userEvent.setup()
    render(<Harness initial="2023-08-01" />)

    await user.clear(ageInput())

    expect(latest).toBe('')
    expect(ageInput()).toHaveValue(null)
  })

  it('keeps the last valid date while the age is above the limit', async () => {
    const user = userEvent.setup()
    render(<Harness initial="2023-08-01" />)

    await user.clear(ageInput())
    await user.type(ageInput(), '150')

    expect(latest).toBe('2011-10-09')
    expect(ageInput()).toHaveValue(150)
  })
})
