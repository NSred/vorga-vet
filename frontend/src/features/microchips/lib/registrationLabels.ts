import type { Sterilised } from '../types'

const STERILISED_SR: Record<Sterilised, string> = { yes: 'da', no: 'ne', unknown: 'nepoznato' }

export const STERILISED_LABELS: Record<Sterilised, string> = {
  yes: 'Yes',
  no: 'No',
  unknown: 'Unknown',
}

export function sterilisedSr(value: Sterilised): string {
  return STERILISED_SR[value]
}
