import type { CalendarView } from '../types'

export interface AppointmentViewState {
  view: CalendarView
  date: string
  showCancelled: boolean
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isCalendarView(value: string | null): value is CalendarView {
  return value === 'day' || value === 'week' || value === 'month'
}

export function parseViewParams(
  params: URLSearchParams,
  fallbackDate: string,
): AppointmentViewState {
  const view = params.get('view')
  const date = params.get('date')

  return {
    view: isCalendarView(view) ? view : 'week',
    date: date && DATE_PATTERN.test(date) ? date : fallbackDate,
    showCancelled: params.get('cancelled') === '1',
  }
}

export function toViewParams(state: AppointmentViewState): URLSearchParams {
  const params = new URLSearchParams()
  params.set('view', state.view)
  params.set('date', state.date)

  if (state.showCancelled) {
    params.set('cancelled', '1')
  }

  return params
}
