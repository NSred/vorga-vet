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

export interface PatientFilters {
  search?: string
  species?: Species | 'all'
  sex?: Sex | 'all'
  allergies?: Allergy | 'all'
  city?: string
  debtorsOnly?: boolean
  status?: 'active' | 'all' | 'deleted'
}
