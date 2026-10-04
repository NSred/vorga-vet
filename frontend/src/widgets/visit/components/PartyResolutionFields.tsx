import { useRef } from 'react'
import { DatePicker, SegmentedControl, Select, TextField, Textarea } from '@/shared/ui'
import { todayIso } from '@/shared/lib/dateOnly'
import {
  BreedPicker,
  generatePatientCardNumber,
  OwnerPicker,
  PatientPicker,
} from '@/features/patients'
import type { Sex, Species } from '@/features/patients'
import type {
  NewPatientValues,
  PatientMode,
  ResolutionErrors,
  ResolutionNeeds,
  ResolutionValues,
} from '../lib/resolution'
import styles from './PartyResolutionFields.module.css'

export interface PartyResolutionFieldsProps {
  needs: ResolutionNeeds
  value: ResolutionValues
  onChange: (value: ResolutionValues) => void
  errors?: ResolutionErrors
}

const MODE_OPTIONS = [
  { value: 'existing', label: 'Existing patient' },
  { value: 'new', label: 'New card' },
] as const

const SPECIES_OPTIONS = [
  { value: 'dog', label: 'Dog' },
  { value: 'cat', label: 'Cat' },
  { value: 'bird', label: 'Bird' },
  { value: 'other', label: 'Other' },
]

const SEX_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

export function PartyResolutionFields({
  needs,
  value,
  onChange,
  errors = {},
}: PartyResolutionFieldsProps) {
  const cardEdited = useRef(false)

  const patch = (next: Partial<ResolutionValues>) => onChange({ ...value, ...next })
  const patchNew = (next: Partial<NewPatientValues>) =>
    onChange({ ...value, newPatient: { ...value.newPatient, ...next } })

  const changeSpecies = (species: Species) => {
    patchNew({
      species,
      breed: null,
      cardNumber: cardEdited.current
        ? value.newPatient.cardNumber
        : generatePatientCardNumber(species),
    })
  }

  return (
    <div className={styles.sections}>
      {needs.owner && (
        <section className={styles.section}>
          <h3 className={styles.title}>Owner</h3>
          <p className={styles.hint}>
            This booking has no owner yet. Pick one or create a new one.
          </p>
          <OwnerPicker
            value={value.owner}
            onChange={(owner) => patch({ owner })}
            error={errors.owner}
          />
        </section>
      )}

      {needs.patient && (
        <section className={styles.section}>
          <h3 className={styles.title}>Patient</h3>
          <p className={styles.hint}>This booking has no patient card yet.</p>
          <SegmentedControl
            value={value.patientMode}
            onChange={(patientMode: PatientMode) => patch({ patientMode })}
            options={MODE_OPTIONS}
          />

          {value.patientMode === 'existing' ? (
            <PatientPicker
              value={value.patient}
              onChange={(patient) => patch({ patient })}
              error={errors.patient}
            />
          ) : (
            <div className={styles.newPatient}>
              <div className={styles.row}>
                <TextField
                  id="new-card-number"
                  label="No. *"
                  value={value.newPatient.cardNumber}
                  onChange={(event) => {
                    cardEdited.current = true
                    patchNew({ cardNumber: event.target.value })
                  }}
                  error={errors.cardNumber}
                />
                <TextField
                  id="new-name"
                  label="Animal name *"
                  value={value.newPatient.name}
                  onChange={(event) => patchNew({ name: event.target.value })}
                  error={errors.name}
                />
              </div>
              <div className={styles.row}>
                <Select
                  id="new-species"
                  label="Species"
                  value={value.newPatient.species}
                  onChange={(species) => changeSpecies(species as Species)}
                  options={SPECIES_OPTIONS}
                />
                <BreedPicker
                  species={value.newPatient.species}
                  value={value.newPatient.breed}
                  onChange={(breed) => patchNew({ breed })}
                  error={errors.breed}
                />
              </div>
              <div className={styles.row}>
                <Select
                  id="new-sex"
                  label="Sex"
                  value={value.newPatient.sex}
                  onChange={(sex) => patchNew({ sex: sex as Sex })}
                  options={SEX_OPTIONS}
                />
                <DatePicker
                  id="new-birth-date"
                  label="Date of birth"
                  value={value.newPatient.birthDate || undefined}
                  onChange={(birthDate) => patchNew({ birthDate })}
                  maxDate={todayIso()}
                />
              </div>
              <div className={styles.row}>
                <TextField
                  id="new-color"
                  label="Color"
                  value={value.newPatient.color}
                  onChange={(event) => patchNew({ color: event.target.value })}
                />
                <TextField
                  id="new-chip"
                  label="Chip no."
                  value={value.newPatient.chipNumber}
                  onChange={(event) => patchNew({ chipNumber: event.target.value })}
                />
              </div>
              <Textarea
                id="new-note"
                label="Note"
                value={value.newPatient.note}
                onChange={(event) => patchNew({ note: event.target.value })}
              />
            </div>
          )}
        </section>
      )}
    </div>
  )
}
