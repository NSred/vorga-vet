import { sexToApi } from './enumMapping'
import type { CreatePatientRequest, PatientFormValues } from '../types'

function optionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function optionalUtcDate(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? `${trimmed}T00:00:00Z` : undefined
}

export function toCreatePatientRequest(values: PatientFormValues): CreatePatientRequest {
  if (!values.owner) {
    throw new Error('Cannot build a create-patient request without an owner')
  }
  if (!values.breed) {
    throw new Error('Cannot build a create-patient request without a breed')
  }

  return {
    ownerId: values.owner.id,
    breedId: values.breed.id,
    cardNumber: values.cardNumber.trim(),
    name: values.name.trim(),
    sex: sexToApi(values.sex),
    birthDate: optionalUtcDate(values.birthDate),
    weightKg: values.weightKg,
    color: optionalText(values.color),
    chipNumber: optionalText(values.chipNumber),
    anamnesis: optionalText(values.anamnesis),
    note: optionalText(values.note),
    allergenIds: values.allergens.map((allergen) => allergen.id),
  }
}
