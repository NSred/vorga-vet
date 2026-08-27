export type Species = 'dog' | 'cat' | 'bird' | 'other'
export type Sex = 'male' | 'female'

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

export interface PatientWriteRequest {
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

export type PatientStatus = 'active' | 'all' | 'deleted'

export interface PatientFilters {
  search?: string
  species?: Species
  sex?: Sex
  allergen?: AllergenOption | null
  city?: string
  status?: PatientStatus
}

export interface PatientListItemDto {
  id: string
  cardNumber: string
  name: string
  species: number
  breedName: string
  sex: number
  birthDate: string | null
  weightKg: number | null
  color: string | null
  chipNumber: string | null
  isDeleted: boolean
  ownerName: string
  phoneNumber: string
  address: string | null
  city: string
  allergies: string[]
}

export interface PatientDetailDto extends Omit<PatientListItemDto, 'allergies'> {
  ownerId: string
  breedId: string
  anamnesis: string | null
  note: string | null
  createdAt: string
  allergies: AllergenOption[]
}

export interface GetPatientsResponseDto {
  items: PatientListItemDto[]
  totalCount: number
  page: number
  pageSize: number
}

export interface PatientListItem {
  id: string
  cardNumber: string
  name: string
  species: Species
  breedName: string
  sex: Sex
  birthDate?: string
  weightKg?: number
  color?: string
  chipNumber?: string
  isDeleted: boolean
  ownerName: string
  phoneNumber: string
  address?: string
  city: string
  allergies: string[]
}

export interface PatientDetail extends Omit<PatientListItem, 'allergies'> {
  ownerId: string
  breedId: string
  anamnesis?: string
  note?: string
  createdAt: string
  allergies: AllergenOption[]
}

export interface PatientPage {
  items: PatientListItem[]
  totalCount: number
  page: number
  pageSize: number
}
