import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, QueryWrapper } from '@/test/renderWithQuery'
import { examinationKeys } from '../api/examinationKeys'
import * as examinationsApi from '../api/examinationsApi'
import {
  useCreateExamination,
  useDeleteAttachment,
  usePayExamination,
  useUpdateExamination,
  useUploadAttachment,
} from './useExaminationMutations'

afterEach(() => {
  vi.restoreAllMocks()
})

function setup<T>(hook: () => T) {
  const client = createTestQueryClient()
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryWrapper client={client}>{children}</QueryWrapper>
  )
  const { result } = renderHook(hook, { wrapper })

  return { result, invalidate }
}

describe('examination mutations', () => {
  it('useCreateExamination invalidates on success', async () => {
    const spy = vi.spyOn(examinationsApi, 'createExamination').mockResolvedValue('e1')
    const { result, invalidate } = setup(() => useCreateExamination())
    const request = {
      patientId: 'p1',
      examination: { performedByFirstName: 'Mira', performedByLastName: 'Vet' },
    }

    result.current.mutate(request)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith(request)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: examinationKeys.all })
  })

  it('usePayExamination invalidates on success and not on failure', async () => {
    vi.spyOn(examinationsApi, 'payExamination').mockRejectedValue(new Error('nope'))
    const failing = setup(() => usePayExamination())

    failing.result.current.mutate('e1')

    await waitFor(() => expect(failing.result.current.isError).toBe(true))
    expect(failing.invalidate).not.toHaveBeenCalled()

    vi.spyOn(examinationsApi, 'payExamination').mockResolvedValue(undefined)
    const passing = setup(() => usePayExamination())

    passing.result.current.mutate('e1')

    await waitFor(() => expect(passing.result.current.isSuccess).toBe(true))
    expect(passing.invalidate).toHaveBeenCalledWith({ queryKey: examinationKeys.all })
  })
})

describe('examination and attachment writes', () => {
  it('useUpdateExamination sends the id and details, then invalidates', async () => {
    const spy = vi.spyOn(examinationsApi, 'updateExamination').mockResolvedValue(undefined)
    const { result, invalidate } = setup(() => useUpdateExamination())
    const examination = { performedByFirstName: 'Mira', performedByLastName: 'Vet' }

    result.current.mutate({ id: 'e1', examination })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith('e1', examination)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: examinationKeys.all })
  })

  it('useUploadAttachment sends the file and kind, then invalidates', async () => {
    const spy = vi.spyOn(examinationsApi, 'uploadAttachment').mockResolvedValue('att1')
    const { result, invalidate } = setup(() => useUploadAttachment())
    const file = new File(['b'], 'scan.png', { type: 'image/png' })

    result.current.mutate({ examinationId: 'e1', file, kind: 'xray' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith('e1', file, 'xray')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: examinationKeys.all })
  })

  it('useDeleteAttachment sends both ids, then invalidates', async () => {
    const spy = vi.spyOn(examinationsApi, 'deleteAttachment').mockResolvedValue(undefined)
    const { result, invalidate } = setup(() => useDeleteAttachment())

    result.current.mutate({ examinationId: 'e1', attachmentId: 'att1' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith('e1', 'att1')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: examinationKeys.all })
  })

  it('leaves the cache alone when an upload fails', async () => {
    vi.spyOn(examinationsApi, 'uploadAttachment').mockRejectedValue(new Error('too big'))
    const { result, invalidate } = setup(() => useUploadAttachment())

    result.current.mutate({
      examinationId: 'e1',
      file: new File(['b'], 'x.png', { type: 'image/png' }),
      kind: 'xray',
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(invalidate).not.toHaveBeenCalled()
  })
})
