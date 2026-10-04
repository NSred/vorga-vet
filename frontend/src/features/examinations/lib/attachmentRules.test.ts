import { describe, expect, it } from 'vitest'
import {
  attachmentFileError,
  attachmentKindLabel,
  formatFileSize,
  MAX_ATTACHMENT_BYTES,
} from './attachmentRules'

function fileOf(type: string, size: number, name = 'scan.png'): File {
  const file = new File(['x'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('attachmentFileError', () => {
  it('accepts the three supported image types', () => {
    expect(attachmentFileError(fileOf('image/jpeg', 1024))).toBeUndefined()
    expect(attachmentFileError(fileOf('image/png', 1024))).toBeUndefined()
    expect(attachmentFileError(fileOf('image/webp', 1024))).toBeUndefined()
  })

  it('rejects any other type', () => {
    expect(attachmentFileError(fileOf('application/pdf', 1024, 'report.pdf'))).toBe(
      'Only JPEG, PNG and WebP images can be attached.',
    )
    expect(attachmentFileError(fileOf('image/gif', 1024, 'a.gif'))).toBe(
      'Only JPEG, PNG and WebP images can be attached.',
    )
  })

  it('rejects an empty file', () => {
    expect(attachmentFileError(fileOf('image/png', 0))).toBe('That file is empty.')
  })

  it('rejects a file over 20 MB', () => {
    expect(attachmentFileError(fileOf('image/png', MAX_ATTACHMENT_BYTES + 1))).toBe(
      'That file is larger than 20 MB.',
    )
    expect(attachmentFileError(fileOf('image/png', MAX_ATTACHMENT_BYTES))).toBeUndefined()
  })
})

describe('attachmentKindLabel', () => {
  it('names both kinds', () => {
    expect(attachmentKindLabel('xray')).toBe('X-ray')
    expect(attachmentKindLabel('ultrasound')).toBe('Ultrasound')
  })
})

describe('formatFileSize', () => {
  it('scales the unit to the size', () => {
    expect(formatFileSize(512)).toBe('512 B')
    expect(formatFileSize(2048)).toBe('2 KB')
    expect(formatFileSize(3 * 1024 * 1024)).toBe('3.0 MB')
  })
})
