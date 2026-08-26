import type { Sex, Species } from '../types'

const SPECIES_TO_API: Record<Species, number> = { dog: 0, cat: 1, bird: 2, other: 3 }
const API_TO_SPECIES: Record<number, Species> = { 0: 'dog', 1: 'cat', 2: 'bird', 3: 'other' }
const SEX_TO_API: Record<Sex, number> = { male: 0, female: 1 }
const API_TO_SEX: Record<number, Sex> = { 0: 'male', 1: 'female' }

export function speciesToApi(species: Species): number {
  return SPECIES_TO_API[species]
}

export function speciesFromApi(value: number): Species {
  const species = API_TO_SPECIES[value]
  if (species === undefined) {
    throw new Error(`Unknown species value received from the API: ${value}`)
  }
  return species
}

export function sexToApi(sex: Sex): number {
  return SEX_TO_API[sex]
}

export function sexFromApi(value: number): Sex {
  const sex = API_TO_SEX[value]
  if (sex === undefined) {
    throw new Error(`Unknown sex value received from the API: ${value}`)
  }
  return sex
}
