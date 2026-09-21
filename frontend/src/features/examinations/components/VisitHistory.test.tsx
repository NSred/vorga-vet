import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { ApiError } from '@/shared/lib/apiClient'
import * as examinationsApi from '../api/examinationsApi'
import type { Examination } from '../types'
import { VisitHistory } from './VisitHistory'

const base: Examination = {
  id: 'e1',
  patientId: 'p1',
  patientName: 'Luna',
  appointmentId: 'a1',
  performedByFirstName: 'Mira',
  performedByLastName: 'Vet',
  startedAt: '2026-09-17T07:00:00Z',
  endedAt: '2026-09-17T07:30:00Z',
  diagnosis: 'otitis',
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
  isPaid: false,
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('VisitHistory', () => {
  it('lists the examinations in the order the backend returned them', async () => {
    vi.spyOn(examinationsApi, 'getPatientExaminations').mockResolvedValue([base, older])

    render(<VisitHistory patientId="p1" />)

    const cards = await screen.findAllByRole('article')
    expect(cards).toHaveLength(2)
    expect(cards[0]).toHaveTextContent('17.09.2026')
    expect(cards[1]).toHaveTextContent('01.08.2026')
  })

  it('shows the origin of each visit', async () => {
    vi.spyOn(examinationsApi, 'getPatientExaminations').mockResolvedValue([base, older])

    const cards = await (async () => {
      render(<VisitHistory patientId="p1" />)
      return screen.findAllByRole('article')
    })()

    expect(cards[0]).toHaveTextContent('Appointment')
    expect(cards[1]).toHaveTextContent('Walk-in')
  })

  it('marks paid, unpaid and cost-free visits', async () => {
    vi.spyOn(examinationsApi, 'getPatientExaminations').mockResolvedValue([
      { ...base, isPaid: true, paidAt: '2026-09-17T08:00:00Z' },
      base,
      older,
    ])

    render(<VisitHistory patientId="p1" />)

    const cards = await screen.findAllByRole('article')
    expect(cards[0]).toHaveTextContent('Paid')
    expect(cards[1]).toHaveTextContent('Unpaid')
    expect(cards[2]).toHaveTextContent('No cost')
  })

  it('offers "Mark as paid" only for an unpaid visit that has a cost', async () => {
    vi.spyOn(examinationsApi, 'getPatientExaminations').mockResolvedValue([
      base,
      { ...base, id: 'e3', isPaid: true },
      older,
    ])

    render(<VisitHistory patientId="p1" />)

    await screen.findAllByRole('article')
    expect(screen.getAllByRole('button', { name: 'Mark as paid' })).toHaveLength(1)
  })

  it('pays a visit and reports it', async () => {
    vi.spyOn(examinationsApi, 'getPatientExaminations').mockResolvedValue([base])
    const paySpy = vi.spyOn(examinationsApi, 'payExamination').mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(<VisitHistory patientId="p1" />)

    await user.click(await screen.findByRole('button', { name: 'Mark as paid' }))

    await waitFor(() => expect(paySpy).toHaveBeenCalledWith('e1'))
    expect(await screen.findByText('Marked as paid')).toBeInTheDocument()
  })

  it('reports a failed payment without claiming success', async () => {
    vi.spyOn(examinationsApi, 'getPatientExaminations').mockResolvedValue([base])
    vi.spyOn(examinationsApi, 'payExamination').mockRejectedValue(
      new ApiError(400, 'x', 'Examinations.AlreadyPaid'),
    )
    const user = userEvent.setup()

    render(<VisitHistory patientId="p1" />)

    await user.click(await screen.findByRole('button', { name: 'Mark as paid' }))

    expect(
      await screen.findByText('This examination is already marked as paid.'),
    ).toBeInTheDocument()
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

  it('hands the examination to the edit callback', async () => {
    vi.spyOn(examinationsApi, 'getPatientExaminations').mockResolvedValue([base])
    const onEdit = vi.fn()
    const user = userEvent.setup()

    render(<VisitHistory patientId="p1" onEdit={onEdit} />)

    await user.click(await screen.findByRole('button', { name: /Edit/ }))

    expect(onEdit).toHaveBeenCalledWith(base)
  })

  it('offers no edit button without a callback', async () => {
    vi.spyOn(examinationsApi, 'getPatientExaminations').mockResolvedValue([base])

    render(<VisitHistory patientId="p1" />)

    await screen.findAllByRole('article')
    expect(screen.queryByRole('button', { name: /Edit/ })).not.toBeInTheDocument()
  })
})
