import { useQueryClient } from '@tanstack/react-query'
import { useRef, type ReactElement } from 'react'
import type { PartyField, PartyRef } from '@/features/appointments'
import {
  ownerLabel,
  OwnerPicker,
  patientDetailQuery,
  patientLabel,
  PatientPicker,
  type OwnerOption,
  type PatientListItem,
} from '@/features/patients'

export interface PartyFields {
  ownerField: (field: PartyField) => ReactElement
  patientField: (field: PartyField) => ReactElement
  ownerOfPatient: (patientId: string) => Promise<PartyRef>
}

export function usePartyFields(): PartyFields {
  const queryClient = useQueryClient()
  const owners = useRef(new Map<string, OwnerOption>())
  const patients = useRef(new Map<string, PatientListItem>())

  return {
    ownerField: (field) => (
      <OwnerPicker
        value={field.value ? (owners.current.get(field.value.id) ?? null) : null}
        onChange={(owner) => {
          owners.current.set(owner.id, owner)
          field.onChange({ id: owner.id, label: ownerLabel(owner) })
        }}
        error={field.error}
      />
    ),
    patientField: (field) => (
      <PatientPicker
        value={field.value ? (patients.current.get(field.value.id) ?? null) : null}
        onChange={(patient) => {
          if (patient) patients.current.set(patient.id, patient)
          field.onChange(patient ? { id: patient.id, label: patientLabel(patient) } : null)
        }}
        error={field.error}
      />
    ),
    ownerOfPatient: async (patientId) => {
      const patient = await queryClient.fetchQuery(patientDetailQuery(patientId))
      return { id: patient.ownerId, label: `${patient.ownerName} · ${patient.phoneNumber}` }
    },
  }
}
