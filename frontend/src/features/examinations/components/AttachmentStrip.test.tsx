import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { ApiError } from '@/shared/lib/apiClient'
import * as examinationsApi from '../api/examinationsApi'
import type { Attachment } from '../types'
import { AttachmentStrip } from './AttachmentStrip'

const xray: Attachment = {
  id: 'att1',
  kind: 'xray',
  fileName: 'chest.png',
  contentType: 'image/png',
  sizeBytes: 2048,
  uploadedAt: '2026-09-17T07:32:00Z',
}

const ultrasound: Attachment = { ...xray, id: 'att2', kind: 'ultrasound', fileName: 'abdomen.webp' }

beforeEach(() => {
  let counter = 0
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => `blob:mock-${++counter}`),
    revokeObjectURL: vi.fn(),
  })
  vi.spyOn(examinationsApi, 'getAttachmentBlob').mockResolvedValue(
    new Blob(['bytes'], { type: 'image/png' }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('AttachmentStrip', () => {
  it('shows a thumbnail per attachment with its kind and name', async () => {
    render(<AttachmentStrip examinationId="e1" attachments={[xray, ultrasound]} />)

    expect(await screen.findByText('X-ray')).toBeInTheDocument()
    expect(screen.getByText('Ultrasound')).toBeInTheDocument()
    expect(screen.getByText('chest.png')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByAltText('chest.png')).toHaveAttribute(
        'src',
        expect.stringContaining('blob:'),
      ),
    )
  })

  it('marks an image that cannot be loaded without failing the card', async () => {
    vi.spyOn(examinationsApi, 'getAttachmentBlob').mockRejectedValue(
      new ApiError(404, 'gone', 'Attachments.ContentMissing'),
    )

    render(<AttachmentStrip examinationId="e1" attachments={[xray]} />)

    expect(await screen.findByText('Image unavailable')).toBeInTheDocument()
    expect(screen.getByText('chest.png')).toBeInTheDocument()
  })

  it('opens the viewer when a thumbnail is clicked', async () => {
    const user = userEvent.setup()
    render(<AttachmentStrip examinationId="e1" attachments={[xray]} />)

    await user.click(await screen.findByRole('button', { name: 'Open chest.png' }))

    const dialog = await screen.findByRole('dialog', { name: 'chest.png' })
    expect(within(dialog).getByText(/X-ray · 2 KB/)).toBeInTheDocument()
  })

  it('confirms before deleting and then calls the route', async () => {
    const deleteSpy = vi.spyOn(examinationsApi, 'deleteAttachment').mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<AttachmentStrip examinationId="e1" attachments={[xray]} />)

    await user.click(await screen.findByRole('button', { name: 'Delete chest.png' }))
    const dialog = await screen.findByRole('dialog', { name: 'Remove this image?' })
    expect(within(dialog).getByText('chest.png will be deleted.')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Remove' }))

    await waitFor(() => expect(deleteSpy).toHaveBeenCalledWith('e1', 'att1'))
    expect(await screen.findByText('Image removed')).toBeInTheDocument()
  })

  it('does not delete when the confirmation is dismissed', async () => {
    const deleteSpy = vi.spyOn(examinationsApi, 'deleteAttachment').mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<AttachmentStrip examinationId="e1" attachments={[xray]} />)

    await user.click(await screen.findByRole('button', { name: 'Delete chest.png' }))
    const dialog = await screen.findByRole('dialog', { name: 'Remove this image?' })
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    expect(deleteSpy).not.toHaveBeenCalled()
  })

  it('reports a failed delete', async () => {
    vi.spyOn(examinationsApi, 'deleteAttachment').mockRejectedValue(
      new ApiError(404, 'gone', 'Attachments.NotFound'),
    )
    const user = userEvent.setup()
    render(<AttachmentStrip examinationId="e1" attachments={[xray]} />)

    await user.click(await screen.findByRole('button', { name: 'Delete chest.png' }))
    const dialog = await screen.findByRole('dialog', { name: 'Remove this image?' })
    await user.click(within(dialog).getByRole('button', { name: 'Remove' }))

    expect(await screen.findByText('That image no longer exists.')).toBeInTheDocument()
  })

  it('offers the uploader with no attachments at all', async () => {
    const user = userEvent.setup()
    render(<AttachmentStrip examinationId="e1" attachments={[]} />)

    await user.click(screen.getByRole('button', { name: /Add image/ }))

    expect(await screen.findByRole('dialog', { name: 'Add an image' })).toBeInTheDocument()
  })
})
