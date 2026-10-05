import { formatDisplayDate } from '@/shared/lib/dateOnly'
import type { OwnerDetails, Sex } from './animal'
import type { Species } from './species'

const SPECIES_SR: Record<Species, string> = {
  dog: 'Pas',
  cat: 'Mačka',
  bird: 'Ptica',
  other: 'Ostalo',
}

const SEX_SR: Record<Sex, string> = { male: 'muški', female: 'ženski' }

export function speciesSr(species: Species): string {
  return SPECIES_SR[species]
}

export function sexSr(sex: Sex): string {
  return SEX_SR[sex]
}

export function dateSr(date: string | null | undefined): string {
  return date ? formatDisplayDate(date) : '—'
}

export function addressOf(owner: OwnerDetails): string {
  return [owner.address, owner.city].filter(Boolean).join(', ') || '—'
}
