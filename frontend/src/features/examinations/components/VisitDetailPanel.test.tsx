import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { ApiError } from '@/shared/lib/apiClient'
import * as examinationsApi from '../api/examinationsApi'
import type { Examination } from '../types'
import { VisitDetailPanel } from './VisitDetailPanel'

const visit: Examination = {
  id: 'e1',
  patientId: 'p1',
  appointmentId: 'a1',
  performedByFirstName: 'Mira',
  performedByLastName: 'Vet',
  startedAt: '2026-09-17T07:00:00Z',
  anamnesis: 'Scratching the left ear.',
  diagnosis: 'otitis',
  therapy: 'Drops twice daily.\nRecheck in two weeks.',
  cost: 1500,
  isPaid: false,
  createdAt: '2026-09-17T07:30:00Z',
  attachments: [
    {
      id: 'att1',
      kind: 'xray',
      fileName: 'chest.png',
      contentType: 'image/png',
      sizeBytes: 2048,
      uploadedAt: '2026-09-17T07:32:00Z',
    },
  ],
}

function renderPanel(overrides: Partial<Parameters<typeof VisitDetailPanel>[0]> = {}) {
  const props = { onClose: vi.fn(), onEdit: vi.fn() }
  render(
    <VisitDetailPanel
      patientId="p1"
      visitId="e1"
      renderCharges={() => <p>charge lines</p>}
      {...props}
      {...overrides}
    />,
  )
  return props
}

beforeEach(() => {
  vi.spyOn(examinationsApi, 'getPatientExaminations').mockResolvedValue([visit])
  vi.spyOn(examinationsApi, 'getAttachmentBlob').mockReturnValue(new Promise(() => undefined))
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('VisitDetailPanel', () => {
  it('shows the whole visit read-only', async () => {
    renderPanel()

    const panel = await screen.findByRole('dialog', { name: 'Visit of 17.09.2026' })
    expect(panel).toHaveTextContent('Mira Vet · Appointment')
    expect(panel).toHaveTextContent('Unpaid')
    expect(within(panel).getByText('Scratching the left ear.')).toBeInTheDocument()
    expect(within(panel).getByText(/Recheck in two weeks/)).toBeInTheDocument()
    expect(within(panel).getByText('charge lines')).toBeInTheDocument()
    expect(panel).toHaveTextContent('1.500,00 RSD')
  })

  it('opens images but does not add or remove them', async () => {
    renderPanel()

    expect(await screen.findByRole('button', { name: 'Open chest.png' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete chest.png' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Add image/ })).not.toBeInTheDocument()
  })

  it('shows a dash for an empty field', async () => {
    vi.mocked(examinationsApi.getPatientExaminations).mockResolvedValue([
      { ...visit, anamnesis: undefined },
    ])
    renderPanel()

    await screen.findByRole('dialog', { name: 'Visit of 17.09.2026' })
    expect(screen.getByText('Anamnesis').nextElementSibling).toHaveTextContent(/^—$/)
  })

  it('marks the visit paid and reports it', async () => {
    const user = userEvent.setup()
    vi.mocked(examinationsApi.getPatientExaminations).mockResolvedValue([
      { ...visit, attachments: [] },
    ])
    const paySpy = vi.spyOn(examinationsApi, 'payExamination').mockResolvedValue(undefined)
    renderPanel()

    await user.click(await screen.findByRole('button', { name: 'Mark as paid' }))

    await waitFor(() => expect(paySpy).toHaveBeenCalledWith('e1'))
    expect(await screen.findByText('Marked as paid')).toBeInTheDocument()
  })

  it('reports a failed payment', async () => {
    const user = userEvent.setup()
    vi.mocked(examinationsApi.getPatientExaminations).mockResolvedValue([
      { ...visit, attachments: [] },
    ])
    vi.spyOn(examinationsApi, 'payExamination').mockRejectedValue(
      new ApiError(400, 'x', 'Examinations.AlreadyPaid'),
    )
    renderPanel()

    await user.click(await screen.findByRole('button', { name: 'Mark as paid' }))

    expect(
      await screen.findByText('This examination is already marked as paid.'),
    ).toBeInTheDocument()
  })

  it('offers no payment for a paid visit and hands the visit to Edit', async () => {
    const user = userEvent.setup()
    vi.mocked(examinationsApi.getPatientExaminations).mockResolvedValue([
      { ...visit, isPaid: true },
    ])
    const { onEdit } = renderPanel()

    await screen.findByRole('dialog', { name: 'Visit of 17.09.2026' })
    expect(screen.queryByRole('button', { name: 'Mark as paid' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '✎ Edit' }))
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'e1' }))
  })

  it('renders nothing without a visit', () => {
    renderPanel({ visitId: null })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
