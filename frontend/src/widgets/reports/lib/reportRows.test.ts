import { describe, expect, it } from 'vitest'
import { reportExamination, reportPatient } from '@/test/reportFixtures'
import { dayRows, dayTotals, unpaidRows, unpaidTotals, vetOf } from './reportRows'

const luna = reportPatient()
const rex = reportPatient({ id: 'p2', name: 'Rex', ownerName: 'Ivan Ilić', phoneNumber: '063 1' })

const rows = [
  {
    patient: luna,
    examination: reportExamination({ id: 'late', startedAt: '2026-10-05T15:00:00Z' }),
  },
  {
    patient: rex,
    examination: reportExamination({
      id: 'early',
      patientId: 'p2',
      startedAt: '2026-10-04T22:30:00Z',
      cost: 1200.1,
      isPaid: true,
    }),
  },
  {
    patient: rex,
    examination: reportExamination({
      id: 'nocost',
      patientId: 'p2',
      startedAt: '2026-10-05T10:00:00Z',
      cost: undefined,
    }),
  },
  {
    patient: luna,
    examination: reportExamination({
      id: 'yesterday',
      startedAt: '2026-10-04T21:59:00Z',
      cost: 800,
    }),
  },
]

describe('report rows', () => {
  it('takes a day by the clinic date, in time order', () => {
    expect(dayRows(rows, '2026-10-05').map((row) => row.examination.id)).toEqual([
      'early',
      'nocost',
      'late',
    ])
    expect(dayRows(rows, '2026-10-04').map((row) => row.examination.id)).toEqual(['yesterday'])
  })

  it('adds up the day, an exam without a cost counting as zero', () => {
    const day = dayRows(rows, '2026-10-05')
    expect(dayTotals(day)).toEqual({ count: 3, total: 3700.1, paid: 1200.1, open: 2500 })
    expect(dayTotals(day).total).toBe(
      day.reduce((sum, row) => sum + (row.examination.cost ?? 0), 0),
    )
  })

  it('lists unpaid exams with a cost, oldest first, and counts the owners', () => {
    const unpaid = unpaidRows(rows)
    expect(unpaid.map((row) => row.examination.id)).toEqual(['yesterday', 'late'])
    expect(unpaidTotals(unpaid)).toEqual({ count: 2, owed: 3300, owners: 1 })
  })

  it("names the exam's vet", () => {
    expect(vetOf(reportExamination())).toBe('Marko Jovanović')
  })
})
