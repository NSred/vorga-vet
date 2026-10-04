import type { AttachmentKind } from '../types'

export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024

export const ACCEPTED_ATTACHMENT_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const KIND_LABELS: Record<AttachmentKind, string> = {
  xray: 'X-ray',
  ultrasound: 'Ultrasound',
}

export function attachmentKindLabel(kind: AttachmentKind): string {
  return KIND_LABELS[kind]
}

export function attachmentFileError(file: File): string | undefined {
  if (!ACCEPTED_ATTACHMENT_TYPES.includes(file.type)) {
    return 'Only JPEG, PNG and WebP images can be attached.'
  }

  if (file.size === 0) {
    return 'That file is empty.'
  }

  if (file.size > MAX_ATTACHMENT_BYTES) {
    return 'That file is larger than 20 MB.'
  }

  return undefined
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
