import { clinicDateOf } from '@/shared/lib/clinicTime'
import type { Species } from '../types'

const SPECIES_LETTER: Record<Species, string> = { dog: 'D', cat: 'C', bird: 'B', other: 'O' }

export function generatePatientCardNumber(species: Species, now: Date = new Date()): string {
  const year = clinicDateOf(now.toISOString()).slice(2, 4)
  const tail = String(Math.floor(Math.random() * 100_000)).padStart(5, '0')

  return `${SPECIES_LETTER[species]}${year}-${tail}`
}
