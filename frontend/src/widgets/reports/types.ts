import type { Examination } from '@/features/examinations'
import type { PatientListItem } from '@/features/patients'

export type ReportView = 'daily' | 'unpaid' | 'deleted'

export interface ReportRow {
  examination: Examination
  patient: PatientListItem
}

export interface DayTotals {
  count: number
  total: number
  paid: number
  open: number
}

export interface UnpaidTotals {
  count: number
  owed: number
  owners: number
}
