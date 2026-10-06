import type { Species } from './species'

export type Sex = 'male' | 'female'

export interface AnimalDetails {
  name: string
  species: Species
  breed: string
  sex: Sex
  birthDate?: string
  color?: string
}

export interface OwnerDetails {
  name: string
  address?: string
  city?: string
  phone?: string
}
