import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import * as examinationsApi from '../api/examinationsApi'
import type { Examination } from '../types'
import { VisitsSummary } from './VisitsSummary'

const latest: Examination = {
  id: 'e1',
  patientId: 'p1',
  performedByFirstName: 'Mira',
  performedByLastName: 'Vet',
  startedAt: '2026-09-17T07:00:00Z',
  diagnosis: 'otitis',
  cost: 1500,
  isPaid: false,
  createdAt: '2026-09-17T07:30:00Z',
  attachments: [],
}

const older: Examination = {
  ...latest,
  id: 'e2',
  startedAt: '2026-08-01T07:00:00Z',
  diagnosis: 'vaccination',
  isPaid: true,
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('VisitsSummary', () => {
  it('shows the count, the latest visit and the unpaid ones, and opens the history', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    vi.spyOn(examinationsApi, 'getPatientExaminations').mockResolvedValue([latest, older])

    render(<VisitsSummary patientId="p1" onOpen={onOpen} />)

    expect(await screen.findByText('17.09.2026')).toBeInTheDocument()
    expect(screen.getByLabelText('2 Visits')).toBeInTheDocument()
    expect(screen.getByText('otitis')).toBeInTheDocument()
    expect(screen.getByText('1 unpaid')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open visit history ›' }))
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('counts a visit without a cost as settled', async () => {
    vi.spyOn(examinationsApi, 'getPatientExaminations').mockResolvedValue([
      { ...latest, cost: undefined },
    ])

    render(<VisitsSummary patientId="p1" onOpen={vi.fn()} />)

    expect(await screen.findByText('17.09.2026')).toBeInTheDocument()
    expect(screen.queryByText(/unpaid/)).not.toBeInTheDocument()
  })

  it('says so and offers no button when there are no visits', async () => {
    vi.spyOn(examinationsApi, 'getPatientExaminations').mockResolvedValue([])

    render(<VisitsSummary patientId="p1" onOpen={vi.fn()} />)

    expect(await screen.findByText('No visits recorded yet.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Open visit history/ })).not.toBeInTheDocument()
  })
})
