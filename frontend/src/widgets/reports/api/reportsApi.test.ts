import { afterEach, describe, expect, it, vi } from 'vitest'
import * as examinationsApi from '@/features/examinations/api/examinationsApi'
import * as patientsApi from '@/features/patients/api/patientsApi'
import { reportExamination, reportPatient } from '@/test/reportFixtures'
import { getDeletedPatients, getExaminationsAcrossPatients } from './reportsApi'

afterEach(() => {
  vi.restoreAllMocks()
})

function patientsInPages(count: number) {
  const all = Array.from({ length: count }, (_, index) =>
    reportPatient({ id: `p${index}`, isDeleted: index === 0 }),
  )
  return vi.spyOn(patientsApi, 'getPatients').mockImplementation(async (_filters, page, size) => ({
    items: all.slice((page - 1) * size, page * size),
    totalCount: all.length,
    page,
    pageSize: size,
  }))
}

describe('reports api', () => {
  it('reads every patient, deleted cards included, and joins their exams', async () => {
    const getPatients = patientsInPages(205)
    const getExams = vi
      .spyOn(examinationsApi, 'getPatientExaminations')
      .mockImplementation(async (patientId) =>
        patientId === 'p0' || patientId === 'p204'
          ? [reportExamination({ id: `e-${patientId}`, patientId })]
          : [],
      )

    const rows = await getExaminationsAcrossPatients()

    expect(getPatients).toHaveBeenCalledTimes(3)
    expect(getPatients).toHaveBeenCalledWith({ status: 'all' }, 1, 100)
    expect(getExams).toHaveBeenCalledTimes(205)
    expect(rows.map((row) => [row.examination.id, row.patient.id])).toEqual([
      ['e-p0', 'p0'],
      ['e-p204', 'p204'],
    ])
  })

  it('runs at most six exam requests at a time', async () => {
    patientsInPages(20)
    let running = 0
    let peak = 0
    vi.spyOn(examinationsApi, 'getPatientExaminations').mockImplementation(async () => {
      running += 1
      peak = Math.max(peak, running)
      await new Promise((resolve) => setTimeout(resolve, 1))
      running -= 1
      return []
    })

    await getExaminationsAcrossPatients()

    expect(peak).toBe(6)
  })

  it('fails when one patient fails, rather than returning part of the clinic', async () => {
    patientsInPages(3)
    vi.spyOn(examinationsApi, 'getPatientExaminations').mockImplementation(async (patientId) => {
      if (patientId === 'p1') throw new Error('boom')
      return [reportExamination({ patientId })]
    })

    await expect(getExaminationsAcrossPatients()).rejects.toThrow('boom')
  })

  it('reads every page of deleted cards', async () => {
    const getPatients = patientsInPages(150)

    expect(await getDeletedPatients()).toHaveLength(150)
    expect(getPatients).toHaveBeenCalledWith({ status: 'deleted' }, 2, 100)
  })
})
