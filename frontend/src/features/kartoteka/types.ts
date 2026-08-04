export type Species = 'pas' | 'macka' | 'ptica' | 'ostalo'
export type Sex = 'muzjak' | 'zenka'
export type Allergy = 'nema' | 'hrana' | 'lekovi' | 'buve_krpelji' | 'polen' | 'ostalo'
export type CardStatus = 'aktivan' | 'obrisan'

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
  species?: Species | 'sve'
  sex?: Sex | 'svi'
  allergies?: Allergy | 'sve'
  city?: string
  debtorsOnly?: boolean
  status?: 'aktivan' | 'svi' | 'obrisan'
}
