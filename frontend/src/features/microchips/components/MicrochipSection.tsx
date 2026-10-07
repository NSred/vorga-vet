import { useState } from 'react'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import { PHONE_QUERY, useMediaQuery } from '@/shared/lib/useMediaQuery'
import {
  DetailSection,
  Button,
  layout,
  PrintPortal,
  RecordItem,
  RecordList,
  Skeleton,
  useToast,
} from '@/shared/ui'
import { usePatientRegistrations } from '../hooks/useMicrochips'
import type { LastRabies, MicrochipRegistration, RegistrationSubject } from '../types'
import { JmbgPrompt } from './JmbgPrompt'
import { RegisterMicrochipDialog } from './RegisterMicrochipDialog'
import { RegistrationSheetPrint } from './RegistrationSheetPrint'
import styles from './MicrochipSection.module.css'

export interface MicrochipSectionProps {
  patientId: string
  subject: RegistrationSubject
  lastRabies?: LastRabies
  vetName?: string
}

interface PrintJob {
  registration: MicrochipRegistration
  jmbg: string
}

export function MicrochipSection({
  patientId,
  subject,
  lastRabies,
  vetName = '',
}: MicrochipSectionProps) {
  const { showToast } = useToast()
  const { data, isPending, isError } = usePatientRegistrations(patientId)
  const [registering, setRegistering] = useState(false)
  const [reprinting, setReprinting] = useState<MicrochipRegistration | null>(null)
  const [printJob, setPrintJob] = useState<PrintJob | null>(null)
  const canPrint = !useMediaQuery(PHONE_QUERY)

  const chipNumber = subject.chipNumber?.trim()
  const registration = data?.find((item) => item.chipNumber === chipNumber) ?? data?.[0]

  return (
    <DetailSection title="Microchip">
      <div className={layout.stackTight}>
        {isPending && <Skeleton height="3rem" />}
        {isError && <p className={styles.muted}>Could not load the registration.</p>}

        {data && registration && (
          <RecordList label="Microchip">
            <RecordItem
              title={`Chip ${registration.chipNumber}`}
              meta={`Implanted ${formatDisplayDate(registration.implantedOn)} · registered by ${registration.vetName}, ${registration.clinic}`}
              actions={
                <Button
                  variant="outline"
                  type="button"
                  className={layout.hideOnPhone}
                  onClick={() => setReprinting(registration)}
                >
                  Print registration sheet
                </Button>
              }
            />
          </RecordList>
        )}

        {data && !registration && !chipNumber && (
          <p className={styles.muted}>
            No chip number on this card yet. Add it with Edit to register the microchip.
          </p>
        )}

        {data && !registration && chipNumber && (
          <RecordList label="Microchip">
            <RecordItem
              title={`Chip ${chipNumber}`}
              meta="Not registered yet"
              actions={
                <Button variant="outline" type="button" onClick={() => setRegistering(true)}>
                  Register microchip
                </Button>
              }
            />
          </RecordList>
        )}

        {registering && chipNumber && (
          <RegisterMicrochipDialog
            patientId={patientId}
            chipNumber={chipNumber}
            subject={subject}
            lastRabies={lastRabies}
            defaultVetName={vetName}
            open
            onOpenChange={setRegistering}
            print={canPrint}
            onRegistered={(saved, jmbg) => {
              setRegistering(false)
              showToast({ tone: 'success', title: `Chip ${saved.chipNumber} was registered` })
              if (canPrint) setPrintJob({ registration: saved, jmbg })
            }}
          />
        )}

        <JmbgPrompt
          open={reprinting !== null}
          onOpenChange={(open) => !open && setReprinting(null)}
          onConfirm={(jmbg) => {
            if (reprinting) setPrintJob({ registration: reprinting, jmbg })
            setReprinting(null)
          }}
        />

        {printJob && (
          <PrintPortal onPrinted={() => setPrintJob(null)}>
            <RegistrationSheetPrint registration={printJob.registration} jmbg={printJob.jmbg} />
          </PrintPortal>
        )}
      </div>
    </DetailSection>
  )
}
