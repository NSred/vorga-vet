import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import * as examinationsApi from '../api/examinationsApi'
import type { Examination } from '../types'
import { VisitHistory } from './VisitHistory'

const base: Examination = {
  id: 'e1',
  patientId: 'p1',
  appointmentId: 'a1',
  performedByFirstName: 'Mira',
  performedByLastName: 'Vet',
  startedAt: '2026-09-17T07:00:00Z',
  anamnesis: 'Scratching the left ear.',
  diagnosis: 'otitis',
  therapy: 'Drops twice daily.',
  cost: 45.5,
  isPaid: false,
  createdAt: '2026-09-17T07:30:00Z',
  attachments: [],
}

const older: Examination = {
  ...base,
  id: 'e2',
  appointmentId: undefined,
  startedAt: '2026-08-01T07:00:00Z',
  diagnosis: 'vaccination',
  cost: undefined,
}

function bodyRows() {
  const [, ...rows] = screen.getAllByRole('row')
  return rows
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('VisitHistory', () => {
  it('lists the visits in the shared table in the order the backend returned them', async () => {
    vi.spyOn(examinationsApi, 'getPatientExaminations').mockResolvedValue([base, older])

    render(<VisitHistory patientId="p1" />)

    await screen.findByRole('table')
    for (const column of ['Date', 'Anamnesis', 'Diagnosis', 'Therapy', 'Amount']) {
      expect(screen.getByRole('columnheader', { name: column })).toBeInTheDocument()
    }
    const [first, second] = bodyRows()
    expect(first).toHaveTextContent('17.09.2026')
    expect(first).toHaveTextContent('Appointment')
    expect(second).toHaveTextContent('01.08.2026')
    expect(second).toHaveTextContent('Walk-in')
  })

  it('marks paid, unpaid and cost-free visits', async () => {
    vi.spyOn(examinationsApi, 'getPatientExaminations').mockResolvedValue([
      { ...base, isPaid: true },
      { ...base, id: 'e3' },
      older,
    ])

    render(<VisitHistory patientId="p1" />)

    await screen.findByRole('table')
    const [paid, unpaid, free] = bodyRows()
    expect(paid).toHaveTextContent('Paid')
    expect(unpaid).toHaveTextContent('Unpaid')
    expect(free).toHaveTextContent('No cost')
  })

  it('shows the outstanding total in the heading', async () => {
    vi.spyOn(examinationsApi, 'getPatientExaminations').mockResolvedValue([
      base,
      { ...base, id: 'e3', cost: 100, isPaid: true },
      { ...base, id: 'e4', cost: 54.5 },
    ])

    render(<VisitHistory patientId="p1" />)

    expect(await screen.findByText('100,00 RSD', { selector: 'strong' })).toBeInTheDocument()
  })

  it('opens a visit on a click anywhere in its row and on Enter', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    vi.spyOn(examinationsApi, 'getPatientExaminations').mockResolvedValue([base, older])

    render(<VisitHistory patientId="p1" onOpen={onOpen} />)

    await user.click(await screen.findByText('otitis'))
    expect(onOpen).toHaveBeenLastCalledWith(base)

    bodyRows()[1].focus()
    await user.keyboard('{Enter}')
    expect(onOpen).toHaveBeenLastCalledWith(older)
  })

  it('offers no edit or payment buttons in the rows', async () => {
    vi.spyOn(examinationsApi, 'getPatientExaminations').mockResolvedValue([base])

    render(<VisitHistory patientId="p1" onOpen={vi.fn()} />)

    await screen.findByRole('table')
    expect(screen.queryByRole('button', { name: /Edit|Mark as paid/ })).not.toBeInTheDocument()
  })

  it('says so when there are no visits', async () => {
    vi.spyOn(examinationsApi, 'getPatientExaminations').mockResolvedValue([])

    render(<VisitHistory patientId="p1" />)

    expect(await screen.findByText('No visits recorded yet.')).toBeInTheDocument()
  })

  it('reports a failed load', async () => {
    vi.spyOn(examinationsApi, 'getPatientExaminations').mockRejectedValue(new Error('boom'))

    render(<VisitHistory patientId="p1" />)

    expect(await screen.findByText('Could not load the visit history.')).toBeInTheDocument()
  })
})
