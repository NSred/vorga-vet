import { sexFromApi, speciesFromApi } from './enumMapping'
import type {
  PatientDetail,
  PatientDetailDto,
  PatientListItem,
  PatientListItemDto,
} from '../types'

function optional<T>(value: T | null): T | undefined {
  return value ?? undefined
}

function dateOnly(value: string): string {
  return value.slice(0, 10)
}

export function toPatientListItem(dto: PatientListItemDto): PatientListItem {
  return {
    id: dto.id,
    cardNumber: dto.cardNumber,
    name: dto.name,
    species: speciesFromApi(dto.species),
    breedName: dto.breedName,
    sex: sexFromApi(dto.sex),
    birthDate: dto.birthDate ? dateOnly(dto.birthDate) : undefined,
    weightKg: optional(dto.weightKg),
    color: optional(dto.color),
    chipNumber: optional(dto.chipNumber),
    isDeleted: dto.isDeleted,
    ownerName: dto.ownerName,
    phoneNumber: dto.phoneNumber,
    address: optional(dto.address),
    city: dto.city,
    allergies: dto.allergies,
  }
}

export function toPatientDetail(dto: PatientDetailDto): PatientDetail {
  const { allergies, ...listFields } = dto

  return {
    ...toPatientListItem({ ...listFields, allergies: [] }),
    ownerId: dto.ownerId,
    breedId: dto.breedId,
    anamnesis: optional(dto.anamnesis),
    note: optional(dto.note),
    createdAt: dateOnly(dto.createdAt),
    allergies,
  }
}
