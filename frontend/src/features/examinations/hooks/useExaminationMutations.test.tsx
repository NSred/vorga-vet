import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, QueryWrapper } from '@/test/renderWithQuery'
import { examinationKeys } from '../api/examinationKeys'
import * as examinationsApi from '../api/examinationsApi'
import { useCreateExamination, usePayExamination } from './useExaminationMutations'

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
