import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { ApiError } from '@/shared/lib/apiClient'
import * as examinationsApi from '../api/examinationsApi'
import { MAX_ATTACHMENT_BYTES } from '../lib/attachmentRules'
import { AttachmentUploader } from './AttachmentUploader'

function renderUploader() {
  const props = { onOpenChange: vi.fn(), onUploaded: vi.fn() }
  render(<AttachmentUploader examinationId="e1" open {...props} />)

  return props
}

function fileOf(type: string, name: string, size?: number): File {
  const file = new File(['bytes'], name, { type })
  if (size !== undefined) Object.defineProperty(file, 'size', { value: size })
  return file
}

beforeEach(() => {
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:mock'),
    revokeObjectURL: vi.fn(),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('AttachmentUploader', () => {
  it('uploads the chosen file with the chosen kind', async () => {
    const uploadSpy = vi.spyOn(examinationsApi, 'uploadAttachment').mockResolvedValue('att1')
    const user = userEvent.setup()
    const props = renderUploader()
    const file = fileOf('image/png', 'chest.png')

    await user.upload(screen.getByLabelText('Image'), file)
    await user.click(screen.getByRole('combobox', { name: 'Kind' }))
    await user.click(await screen.findByRole('option', { name: 'Ultrasound' }))
    await user.click(screen.getByRole('button', { name: 'Upload' }))

    await waitFor(() => expect(uploadSpy).toHaveBeenCalledWith('e1', file, 'ultrasound'))
    expect(props.onUploaded).toHaveBeenCalled()
  })

  it('defaults to an x-ray', async () => {
    const uploadSpy = vi.spyOn(examinationsApi, 'uploadAttachment').mockResolvedValue('att1')
    const user = userEvent.setup()
    renderUploader()

    await user.upload(screen.getByLabelText('Image'), fileOf('image/jpeg', 'scan.jpg'))
    await user.click(screen.getByRole('button', { name: 'Upload' }))

    await waitFor(() => expect(uploadSpy).toHaveBeenCalledWith('e1', expect.anything(), 'xray'))
  })

  it('rejects an unsupported type before calling the backend', async () => {
    const uploadSpy = vi.spyOn(examinationsApi, 'uploadAttachment')
    const user = userEvent.setup({ applyAccept: false })
    renderUploader()

    await user.upload(screen.getByLabelText('Image'), fileOf('application/pdf', 'report.pdf'))

    expect(
      await screen.findByText('Only JPEG, PNG and WebP images can be attached.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Upload' }))

    expect(uploadSpy).not.toHaveBeenCalled()
  })

  it('rejects a file over 20 MB before calling the backend', async () => {
    const uploadSpy = vi.spyOn(examinationsApi, 'uploadAttachment')
    const user = userEvent.setup()
    renderUploader()

    await user.upload(
      screen.getByLabelText('Image'),
      fileOf('image/png', 'huge.png', MAX_ATTACHMENT_BYTES + 1),
    )

    expect(await screen.findByText('That file is larger than 20 MB.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Upload' }))
    expect(uploadSpy).not.toHaveBeenCalled()
  })

  it('asks for a file when none was chosen', async () => {
    const uploadSpy = vi.spyOn(examinationsApi, 'uploadAttachment')
    const user = userEvent.setup()
    renderUploader()

    await user.click(screen.getByRole('button', { name: 'Upload' }))

    expect(await screen.findByText('Choose an image first.')).toBeInTheDocument()
    expect(uploadSpy).not.toHaveBeenCalled()
  })

  it('shows a backend rejection inline and stays open', async () => {
    vi.spyOn(examinationsApi, 'uploadAttachment').mockRejectedValue(
      new ApiError(400, 'x', 'Attachments.UnsupportedContentType'),
    )
    const user = userEvent.setup()
    const props = renderUploader()

    await user.upload(screen.getByLabelText('Image'), fileOf('image/png', 'chest.png'))
    await user.click(screen.getByRole('button', { name: 'Upload' }))

    expect(
      await screen.findByText('Only JPEG, PNG and WebP images can be attached.'),
    ).toBeInTheDocument()
    expect(props.onUploaded).not.toHaveBeenCalled()
  })

  it('accepts a file dropped on the dropzone', async () => {
    const uploadSpy = vi.spyOn(examinationsApi, 'uploadAttachment').mockResolvedValue('att1')
    const user = userEvent.setup()
    renderUploader()
    const file = fileOf('image/png', 'dropped.png', 2048)

    const dropzone = screen.getByLabelText('Image').parentElement as HTMLElement
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } })

    expect(await screen.findByText('dropped.png · 2 KB')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Upload' }))
    await waitFor(() => expect(uploadSpy).toHaveBeenCalledWith('e1', file, 'xray'))
  })

  it('shows the chosen file name and size', async () => {
    const user = userEvent.setup()
    renderUploader()

    await user.upload(screen.getByLabelText('Image'), fileOf('image/png', 'chest.png', 2048))

    expect(await screen.findByText('chest.png · 2 KB')).toBeInTheDocument()
  })
})
