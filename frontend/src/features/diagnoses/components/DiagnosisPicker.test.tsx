import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { typeDiagnosis } from '@/test/diagnosisPicking'
import { listDiagnoses, resetDiagnosesStore } from '../api/mockDiagnosesStore'
import { DiagnosisPicker } from './DiagnosisPicker'

function Harness({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial)
  return (
    <>
      <DiagnosisPicker value={value} onChange={setValue} />
      <p data-testid="value">{value}</p>
    </>
  )
}

beforeEach(() => {
  resetDiagnosesStore()
})

describe('DiagnosisPicker', () => {
  it('fills in a picked diagnosis and offers no add button for it', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Diagnosis' }))
    await user.click(await screen.findByRole('option', { name: /^Otitis externa/ }))

    expect(screen.getByTestId('value')).toHaveTextContent('Otitis externa')
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: '＋ Add to diagnosis list' }),
      ).not.toBeInTheDocument(),
    )
  })

  it('offers only active diagnoses, with their code', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Diagnosis' }))

    expect(await screen.findByRole('option', { name: /Sine morbi.*D01/ })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /Vakcinacija/ })).not.toBeInTheDocument()
  })

  it('keeps typed text and adds it to the list on request', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await typeDiagnosis(user, 'Otitis media')
    expect(screen.getByTestId('value')).toHaveTextContent('Otitis media')

    await user.click(await screen.findByRole('button', { name: '＋ Add to diagnosis list' }))

    expect(
      await screen.findByText('Otitis media was added to the diagnosis list'),
    ).toBeInTheDocument()
    expect(listDiagnoses({ search: 'media', status: 0, page: 1, pageSize: 25 }).totalCount).toBe(1)
  })

  it('treats a retired name as already listed', async () => {
    render(<Harness initial="vakcinacija" />)

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Diagnosis' })).toHaveTextContent('vakcinacija'),
    )
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(
      screen.queryByRole('button', { name: '＋ Add to diagnosis list' }),
    ).not.toBeInTheDocument()
  })

  it('shows an old exam diagnosis as it was typed', () => {
    render(<Harness initial="Nesto" />)

    expect(screen.getByRole('button', { name: 'Diagnosis' })).toHaveTextContent('Nesto')
  })

  it('adds a new diagnosis with its code through the dialog and uses it', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Diagnosis' }))
    await user.type(screen.getByLabelText('Search Diagnosis'), 'Otitis media')
    await user.click(
      await screen.findByRole('button', { name: '＋ Create diagnosis "Otitis media"' }),
    )

    const dialog = await screen.findByRole('dialog', { name: 'New diagnosis' })
    expect(within(dialog).getByLabelText('Name *')).toHaveValue('Otitis media')
    await user.type(within(dialog).getByLabelText('Code'), 'D40')
    await user.click(within(dialog).getByRole('button', { name: 'Add to diagnosis list' }))

    await waitFor(() => expect(screen.getByTestId('value')).toHaveTextContent('Otitis media'))
    expect(screen.queryByRole('dialog', { name: 'New diagnosis' })).not.toBeInTheDocument()
    expect(
      listDiagnoses({ search: 'media', status: 0, page: 1, pageSize: 25 }).items[0],
    ).toMatchObject({ name: 'Otitis media', code: 'D40' })
  })

  it('keeps the dialog open on a duplicate name', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Diagnosis' }))
    await user.type(screen.getByLabelText('Search Diagnosis'), 'vakcinacija')
    await user.click(
      await screen.findByRole('button', { name: '＋ Create diagnosis "vakcinacija"' }),
    )
    const dialog = await screen.findByRole('dialog', { name: 'New diagnosis' })
    await user.click(within(dialog).getByRole('button', { name: 'Add to diagnosis list' }))

    expect(await within(dialog).findByText(/already on the list/)).toBeInTheDocument()
    expect(screen.getByTestId('value')).toHaveTextContent('')
  })
})
