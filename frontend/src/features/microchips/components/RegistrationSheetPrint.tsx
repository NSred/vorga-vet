import { addressOf, dateSr, sexSr, speciesSr } from '@/shared/domain/printLabels'
import { PrintDocument, PrintField, PrintSection } from '@/shared/ui'
import { sterilisedSr } from '../lib/registrationLabels'
import type { MicrochipRegistration } from '../types'

export interface RegistrationSheetPrintProps {
  registration: MicrochipRegistration
  jmbg: string
}

export function RegistrationSheetPrint({ registration, jmbg }: RegistrationSheetPrintProps) {
  const { animal, owner, lastRabies } = registration

  return (
    <PrintDocument
      issuer={registration.clinic}
      title="Prijava obeležavanja mikročipom"
      reference={`Broj mikročipa: ${registration.chipNumber}`}
      footerLines={[
        `Datum: ${dateSr(registration.implantedOn)}`,
        `Mikročip ugradio: ${registration.vetName}`,
      ]}
      signatures={['Potpis vlasnika', 'Potpis veterinara', 'M.P.']}
      footerLayout="stacked"
    >
      <PrintSection title="Vlasnik">
        <PrintField label="Ime i prezime" value={owner.name} />
        <PrintField label="JMBG" value={jmbg} />
        <PrintField label="Adresa" value={addressOf(owner)} />
        <PrintField label="Telefon" value={owner.phone} />
      </PrintSection>

      <PrintSection title="Životinja">
        <PrintField label="Ime" value={animal.name} />
        <PrintField label="Vrsta" value={speciesSr(animal.species)} />
        <PrintField label="Rasa" value={animal.breed} />
        <PrintField label="Pol" value={sexSr(animal.sex)} />
        <PrintField label="Datum rođenja" value={dateSr(animal.birthDate)} />
        <PrintField label="Boja" value={animal.color} />
        <PrintField label="Sterilisan" value={sterilisedSr(registration.sterilised)} />
        <PrintField label="Datum ugradnje mikročipa" value={dateSr(registration.implantedOn)} />
      </PrintSection>

      <PrintSection title="Poslednja vakcinacija protiv besnila">
        <PrintField label="Vakcina" value={lastRabies?.vaccineName} />
        <PrintField label="Datum vakcinacije" value={dateSr(lastRabies?.givenOn)} />
      </PrintSection>

      <PrintSection>
        <PrintField
          label="Saglasnost za objavljivanje podataka na internetu"
          value={registration.consentToPublish ? 'da' : 'ne'}
        />
      </PrintSection>
    </PrintDocument>
  )
}
