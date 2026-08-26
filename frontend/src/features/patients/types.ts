export type Species = 'dog' | 'cat' | 'bird' | 'other'
export type Sex = 'male' | 'female'
export type Allergy = 'none' | 'food' | 'medication' | 'fleas_ticks' | 'pollen' | 'other'
export type CardStatus = 'active' | 'deleted'

export interface Visit {
  id: string
  type: string
  date: string
  title: string
  description?: string
  costRsd?: number
}

export interface Patient {
  id: string
  cardNumber: string
  name: string
  species: Species
  breed: string
  sex: Sex
  birthDate?: string
  age?: number
  weightKg?: number
  color?: string
  chipNumber?: string
  cardStatus: CardStatus
  allergies: Allergy
  anamnesis?: string
  note?: string
  ownerName: string
  phone?: string
  mobile?: string
  address?: string
  city: string
  totalServicesRsd?: number
  paidRsd?: number
  visits: Visit[]
}

export type PatientInput = Omit<Patient, 'id' | 'visits' | 'cardStatus'>

export interface OwnerOption {
  id: string
  firstName: string
  lastName: string
  phoneNumber: string
}

export interface BreedOption {
  id: string
  name: string
}

export interface AllergenOption {
  id: string
  name: string
}

export interface CreateOwnerRequest {
  firstName: string
  lastName: string
  phoneNumber: string
  address: string
  city: string
}

export interface CreateBreedRequest {
  name: string
  species: Species
}

export interface CreateAllergenRequest {
  name: string
}

export interface CreatePatientRequest {
  ownerId: string
  breedId: string
  cardNumber: string
  name: string
  sex: number
  birthDate?: string
  weightKg?: number
  color?: string
  chipNumber?: string
  anamnesis?: string
  note?: string
  allergenIds: string[]
}

export interface PatientFormValues {
  cardNumber: string
  name: string
  species: Species
  owner: OwnerOption | null
  breed: BreedOption | null
  sex: Sex
  birthDate?: string
  weightKg?: number
  color?: string
  chipNumber?: string
  allergens: AllergenOption[]
  anamnesis?: string
  note?: string
}

export interface PatientFilters {
  search?: string
  species?: Species | 'all'
  sex?: Sex | 'all'
  allergies?: Allergy | 'all'
  city?: string
  debtorsOnly?: boolean
  status?: 'active' | 'all' | 'deleted'
}
