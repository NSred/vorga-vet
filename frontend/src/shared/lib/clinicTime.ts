import { TZDate } from '@date-fns/tz'
import { addDays, addMonths, format, startOfMonth, startOfWeek } from 'date-fns'

export const CLINIC_TIME_ZONE = 'Europe/Belgrade'

export interface DateRange {
  from: string
  to: string
}

function clinicMidnight(dateIso: string): TZDate {
  const [year, month, day] = dateIso.split('-').map(Number)
  return new TZDate(year, month - 1, day, 0, 0, 0, 0, CLINIC_TIME_ZONE)
}

function zoned(utcIso: string): TZDate {
  return new TZDate(new Date(utcIso), CLINIC_TIME_ZONE)
}

function dateIsoOf(value: Date): string {
  return format(new TZDate(value, CLINIC_TIME_ZONE), 'yyyy-MM-dd')
}

function utcIsoOf(value: Date): string {
  return new Date(value.getTime()).toISOString()
}

function rangeOfDays(startDateIso: string, days: number): DateRange {
  const start = clinicMidnight(startDateIso)

  return { from: utcIsoOf(start), to: utcIsoOf(addDays(start, days)) }
}

export function clinicToday(): string {
  return dateIsoOf(new Date())
}

export function clinicDateOf(utcIso: string): string {
  return format(zoned(utcIso), 'yyyy-MM-dd')
}

export function clinicTimeOf(utcIso: string): string {
  return format(zoned(utcIso), 'HH:mm')
}

export function clinicDayRange(dateIso: string): DateRange {
  return rangeOfDays(dateIso, 1)
}

export function clinicWeekRange(dateIso: string): DateRange {
  const monday = startOfWeek(clinicMidnight(dateIso), { weekStartsOn: 1 })

  return rangeOfDays(dateIsoOf(monday), 7)
}

export function clinicMonthGridRange(dateIso: string): DateRange {
  const gridStart = startOfWeek(startOfMonth(clinicMidnight(dateIso)), { weekStartsOn: 1 })

  return rangeOfDays(dateIsoOf(gridStart), 42)
}

export function clinicRecentDaysRange(days: number, endDateIso: string): DateRange {
  return rangeOfDays(addClinicDays(endDateIso, -(days - 1)), days)
}

export function addClinicDays(dateIso: string, amount: number): string {
  return dateIsoOf(addDays(clinicMidnight(dateIso), amount))
}

export function addClinicWeeks(dateIso: string, amount: number): string {
  return addClinicDays(dateIso, amount * 7)
}

export function addClinicMonths(dateIso: string, amount: number): string {
  return dateIsoOf(addMonths(clinicMidnight(dateIso), amount))
}
