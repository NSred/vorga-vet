import { useState } from 'react'
import { clinicToday } from '@/shared/lib/clinicTime'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  layout,
  PrintPortal,
  RecordItem,
  RecordList,
  Skeleton,
  useToast,
} from '@/shared/ui'
import { usePatientCertificates } from '../hooks/useCertificates'
import { useRemoveVaccination } from '../hooks/useVaccinationMutations'
import { usePatientVaccinations } from '../hooks/useVaccinationQueries'
import { nextDue } from '../lib/vaccinationMapping'
import type { CertificateSubject, RabiesCertificate, Vaccination } from '../types'
import { AddVaccinationDialog } from './AddVaccinationDialog'
import { IssueCertificateDialog } from './IssueCertificateDialog'
import { RabiesCertificatePrint } from './RabiesCertificatePrint'
import styles from './PatientSections.module.css'

export interface VaccinationsSectionProps {
  patientId: string
  certificateSubject?: CertificateSubject
  vetName?: string
}

export function VaccinationsSection({
  patientId,
  certificateSubject,
  vetName = '',
}: VaccinationsSectionProps) {
  const { showToast } = useToast()
  const { data, isPending, isError } = usePatientVaccinations(patientId)
  const remove = useRemoveVaccination()
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<Vaccination | null>(null)
  const [issuing, setIssuing] = useState<Vaccination | null>(null)
  const [printing, setPrinting] = useState<RabiesCertificate | null>(null)
  const certificates = usePatientCertificates(patientId)
  const certificateFor = (vaccinationId: string) =>
    certificates.data?.find((certificate) => certificate.vaccinationId === vaccinationId)
  const today = clinicToday()

  const upcoming = data ? nextDue(data) : undefined

  return (
    <div className={layout.stackTight}>
      {isPending && <Skeleton height="4rem" />}
      {isError && <p className={styles.muted}>Could not load the vaccinations.</p>}

      {upcoming && (
        <p className={styles.next}>
          Next due: <strong>{upcoming.vaccineName}</strong> on {formatDisplayDate(upcoming.dueOn)}
          {upcoming.dueOn < today && <Badge tone="danger">Overdue</Badge>}
        </p>
      )}

      {data && data.length === 0 && <EmptyState message="No vaccinations recorded yet." />}

      {data && data.length > 0 && (
        <RecordList label="Vaccinations">
          {data.map((vaccination) => (
            <RecordItem
              key={vaccination.id}
              title={
                <>
                  {vaccination.vaccineName}
                  {vaccination.isRabies && <Badge tone="warn">Rabies</Badge>}
                </>
              }
              meta={
                <>
                  Given {formatDisplayDate(vaccination.givenOn)} · due{' '}
                  {formatDisplayDate(vaccination.dueOn)}
                  {vaccination.batch && ` · batch ${vaccination.batch}`}
                  {' · '}
                  {vaccination.source === 'exam' ? 'from an exam' : 'entered by hand'}
                </>
              }
              actions={
                <>
                  {vaccination.isRabies && certificateFor(vaccination.id) && (
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setPrinting(certificateFor(vaccination.id) ?? null)}
                    >
                      Print certificate
                    </Button>
                  )}
                  {vaccination.isRabies &&
                    !certificateFor(vaccination.id) &&
                    certificateSubject && (
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => setIssuing(vaccination)}
                      >
                        Certificate
                      </Button>
                    )}
                  {vaccination.source === 'manual' && (
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setRemoving(vaccination)}
                    >
                      Remove
                    </Button>
                  )}
                </>
              }
            />
          ))}
        </RecordList>
      )}

      <div>
        <Button variant="outline" type="button" onClick={() => setAdding(true)}>
          ＋ Vaccination
        </Button>
      </div>

      {issuing && certificateSubject && (
        <IssueCertificateDialog
          vaccination={issuing}
          subject={certificateSubject}
          defaultVetName={vetName}
          open
          onOpenChange={(open) => !open && setIssuing(null)}
          onIssued={(certificate) => {
            setIssuing(null)
            showToast({ tone: 'success', title: `Certificate ${certificate.number} was issued` })
            setPrinting(certificate)
          }}
        />
      )}

      {printing && (
        <PrintPortal onPrinted={() => setPrinting(null)}>
          <RabiesCertificatePrint certificate={printing} />
        </PrintPortal>
      )}

      <AddVaccinationDialog
        patientId={patientId}
        open={adding}
        onOpenChange={setAdding}
        onAdded={(name) => {
          setAdding(false)
          showToast({ tone: 'success', title: `${name} was added` })
        }}
      />

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Remove ${removing?.vaccineName ?? 'this vaccination'}?`}
        description="Only vaccinations entered by hand can be removed. Ones from an exam change when the exam is edited."
        confirmLabel="Remove"
        tone="danger"
        isPending={remove.isPending}
        onConfirm={() =>
          removing &&
          remove.mutate(removing.id, {
            onSuccess: () => {
              setRemoving(null)
              showToast({ tone: 'success', title: 'Vaccination removed' })
            },
            onError: () => {
              setRemoving(null)
              showToast({ tone: 'error', title: 'Could not remove the vaccination' })
            },
          })
        }
      />
    </div>
  )
}
