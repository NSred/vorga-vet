import type { Species } from '../types'

const SPECIES_LETTER: Record<Species, string> = { dog: 'D', cat: 'C', bird: 'B', other: 'O' }

export function generatePatientCardNumber(species: Species, now: Date = new Date()): string {
  const year = String(now.getFullYear() % 100).padStart(2, '0')
  const tail = String(Math.floor(Math.random() * 100_000)).padStart(5, '0')

  return `${SPECIES_LETTER[species]}${year}-${tail}`
}
