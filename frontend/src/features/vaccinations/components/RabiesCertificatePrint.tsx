import { addressOf, dateSr, sexSr, speciesSr } from '@/shared/domain/printLabels'
import { PrintDocument, PrintField, PrintSection } from '@/shared/ui'
import type { RabiesCertificate } from '../types'

export interface RabiesCertificatePrintProps {
  certificate: RabiesCertificate
}

export function RabiesCertificatePrint({ certificate }: RabiesCertificatePrintProps) {
  const { animal, owner } = certificate
  const licence = certificate.vetLicence ? `, broj licence ${certificate.vetLicence}` : ''

  return (
    <PrintDocument
      issuer={certificate.issuedBy}
      title="Potvrda o vakcinaciji protiv besnila"
      reference={`Broj potvrde: ${certificate.number}`}
      footerLines={[
        `Datum izdavanja: ${dateSr(certificate.issuedOn)}`,
        `Veterinar: ${certificate.vetName}${licence}`,
      ]}
      signatures={['Potpis veterinara', 'M.P.']}
    >
      <PrintSection title="Podaci o životinji">
        <PrintField label="Ime" value={animal.name} />
        <PrintField label="Vrsta" value={speciesSr(animal.species)} />
        <PrintField label="Rasa" value={animal.breed} />
        <PrintField label="Pol" value={sexSr(animal.sex)} />
        <PrintField label="Datum rođenja" value={dateSr(animal.birthDate)} />
        <PrintField label="Boja" value={animal.color} />
        <PrintField label="Broj mikročipa" value={animal.chipNumber} />
        <PrintField label="Datum ugradnje mikročipa" value={dateSr(certificate.chipImplantedOn)} />
        <PrintField label="Broj pasoša" value={certificate.passportNumber} />
        <PrintField label="Datum izdavanja pasoša" value={dateSr(certificate.passportIssuedOn)} />
      </PrintSection>

      <PrintSection title="Vlasnik">
        <PrintField label="Ime i prezime" value={owner.name} />
        <PrintField label="Adresa" value={addressOf(owner)} />
        <PrintField label="Telefon" value={owner.phone} />
      </PrintSection>

      <PrintSection title="Vakcinacija">
        <PrintField label="Vakcina" value={certificate.vaccineName} />
        <PrintField label="Serija" value={certificate.batch} />
        <PrintField label="Datum vakcinacije" value={dateSr(certificate.givenOn)} />
        <PrintField label="Važi do" value={dateSr(certificate.validUntil)} />
      </PrintSection>
    </PrintDocument>
  )
}
