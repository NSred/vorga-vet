import { useQuery } from '@tanstack/react-query'
import { getDueItems, getPatientReminders, getPatientVaccinations } from '../api/vaccinationsApi'
import { vaccinationKeys } from '../api/vaccinationKeys'

export function usePatientVaccinations(patientId: string) {
  return useQuery({
    queryKey: vaccinationKeys.patient(patientId),
    queryFn: () => getPatientVaccinations(patientId),
    meta: { errorTitle: 'Could not load the vaccinations' },
  })
}

export function usePatientReminders(patientId: string) {
  return useQuery({
    queryKey: vaccinationKeys.reminders(patientId),
    queryFn: () => getPatientReminders(patientId),
    meta: { errorTitle: 'Could not load the reminders' },
  })
}

export function useDueItems(until: string) {
  return useQuery({
    queryKey: vaccinationKeys.due(until),
    queryFn: () => getDueItems(until),
    meta: { errorTitle: 'Could not load what is due' },
  })
}

export function useLatestRabiesVaccination(patientId: string) {
  const { data } = usePatientVaccinations(patientId)
  return data
    ?.filter((vaccination) => vaccination.isRabies)
    .sort((a, b) => b.givenOn.localeCompare(a.givenOn))[0]
}
