import type { ExaminationDetails, ExaminationFormValues } from '../types'

function trimmed(value: string): string | undefined {
  const text = value.trim()
  return text ? text : undefined
}

export function parseCost(value: string): number | undefined {
  const text = value.trim().replace(',', '.')
  if (!text) return undefined

  const cost = Number(text)
  return Number.isFinite(cost) ? cost : undefined
}

export function toExaminationDetails(values: ExaminationFormValues): ExaminationDetails {
  return {
    performedByFirstName: values.performedByFirstName.trim(),
    performedByLastName: values.performedByLastName.trim(),
    anamnesis: trimmed(values.anamnesis),
    diagnosis: trimmed(values.diagnosis),
    therapy: trimmed(values.therapy),
    cost: parseCost(values.cost),
  }
}

export function emptyExaminationValues(
  performedByFirstName = '',
  performedByLastName = '',
): ExaminationFormValues {
  return {
    performedByFirstName,
    performedByLastName,
    anamnesis: '',
    diagnosis: '',
    therapy: '',
    cost: '',
  }
}
