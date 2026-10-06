import type { Examination } from '@/features/examinations'
import { clinicDateOf } from '@/shared/lib/clinicTime'
import type { DayTotals, ReportRow, UnpaidTotals } from '../types'

function cents(amount: number): number {
  return Math.round(amount * 100)
}

function costOf(row: ReportRow): number {
  return row.examination.cost ?? 0
}

function byStart(a: ReportRow, b: ReportRow): number {
  return a.examination.startedAt.localeCompare(b.examination.startedAt)
}

export function vetOf(examination: Examination): string {
  return `${examination.performedByFirstName} ${examination.performedByLastName}`.trim()
}

export function dayRows(rows: ReportRow[], day: string): ReportRow[] {
  return rows.filter((row) => clinicDateOf(row.examination.startedAt) === day).sort(byStart)
}

export function unpaidRows(rows: ReportRow[]): ReportRow[] {
  return rows.filter((row) => !row.examination.isPaid && costOf(row) > 0).sort(byStart)
}

export function dayTotals(rows: ReportRow[]): DayTotals {
  const total = rows.reduce((sum, row) => sum + cents(costOf(row)), 0)
  const paid = rows
    .filter((row) => row.examination.isPaid)
    .reduce((sum, row) => sum + cents(costOf(row)), 0)
  return { count: rows.length, total: total / 100, paid: paid / 100, open: (total - paid) / 100 }
}

export function unpaidTotals(rows: ReportRow[]): UnpaidTotals {
  const owed = rows.reduce((sum, row) => sum + cents(costOf(row)), 0)
  const owners = new Set(rows.map((row) => `${row.patient.ownerName}|${row.patient.phoneNumber}`))
  return { count: rows.length, owed: owed / 100, owners: owners.size }
}
