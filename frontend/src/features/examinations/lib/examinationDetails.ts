import type { Examination, ExaminationDetails, ExaminationFormValues } from '../types'

function trimmed(value: string): string | undefined {
  const text = value.trim()
  return text ? text : undefined
}

export function toExaminationDetails(
  values: ExaminationFormValues,
  cost?: number,
): ExaminationDetails {
  return {
    performedByFirstName: values.performedByFirstName.trim(),
    performedByLastName: values.performedByLastName.trim(),
    anamnesis: trimmed(values.anamnesis),
    diagnosis: trimmed(values.diagnosis),
    therapy: trimmed(values.therapy),
    cost,
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
  }
}

export function examinationValuesOf(examination: Examination): ExaminationFormValues {
  return {
    performedByFirstName: examination.performedByFirstName,
    performedByLastName: examination.performedByLastName,
    anamnesis: examination.anamnesis ?? '',
    diagnosis: examination.diagnosis ?? '',
    therapy: examination.therapy ?? '',
  }
}
