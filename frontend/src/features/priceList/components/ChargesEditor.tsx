import { formatPrice } from '@/shared/lib/money'
import { addClinicDays } from '@/shared/lib/clinicTime'
import { Button, DatePicker, fieldStyles, IconButton, TextField } from '@/shared/ui'
import {
  chargesError,
  chargesTotal,
  draftErrors,
  draftFromItem,
  draftTotal,
  extraDraft,
  KIND_LABEL,
} from '../lib/charges'
import type { ChargeDraft } from '../types'
import { PriceItemPicker } from './PriceItemPicker'
import styles from './ChargesEditor.module.css'

export interface ChargesEditorProps {
  drafts: ChargeDraft[]
  onChange: (drafts: ChargeDraft[]) => void
  showErrors: boolean
  givenOn: string
}

export function ChargesEditor({ drafts, onChange, showErrors, givenOn }: ChargesEditorProps) {
  const update = (key: string, patch: Partial<ChargeDraft>) =>
    onChange(drafts.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft)))

  const updateVaccine = (
    draft: ChargeDraft,
    patch: Partial<NonNullable<ChargeDraft['vaccine']>>,
  ) => {
    if (draft.vaccine) update(draft.key, { vaccine: { ...draft.vaccine, ...patch } })
  }

  const remove = (key: string) => onChange(drafts.filter((draft) => draft.key !== key))

  const totalError = showErrors ? chargesError(drafts) : undefined

  return (
    <section className={styles.charges} aria-label="Charges">
      <div className={styles.heading}>
        <span className={styles.title}>Charges</span>
        <span className={styles.hint}>Services and medications come from the price list.</span>
      </div>

      {drafts.length > 0 && (
        <ul className={styles.lines}>
          {drafts.map((draft, index) => {
            const errors = showErrors ? draftErrors(draft) : {}
            const lineName = draft.name.trim() || `additional cost ${index + 1}`
            const total = draftTotal(draft)

            return (
              <li key={draft.key} className={styles.line}>
                <div className={styles.lineHead}>
                  <span className={styles.kind}>{KIND_LABEL[draft.kind]}</span>
                  <IconButton
                    type="button"
                    label={`Remove ${lineName}`}
                    onClick={() => remove(draft.key)}
                  >
                    ✕
                  </IconButton>
                </div>

                {draft.kind === 'extra' ? (
                  <TextField
                    id={`charge-name-${draft.key}`}
                    label={`Description of additional cost ${index + 1}`}
                    hideLabel
                    compact
                    invalid={Boolean(errors.name)}
                    placeholder="What is this cost for?"
                    value={draft.name}
                    onChange={(event) => update(draft.key, { name: event.target.value })}
                  />
                ) : (
                  <span className={styles.name}>{draft.name}</span>
                )}

                <div className={styles.inputs}>
                  <TextField
                    id={`charge-quantity-${draft.key}`}
                    label="Qty"
                    aria-label={`Quantity of ${lineName}`}
                    compact
                    className={styles.short}
                    invalid={Boolean(errors.quantity)}
                    inputMode="decimal"
                    value={draft.quantity}
                    onChange={(event) => update(draft.key, { quantity: event.target.value })}
                  />
                  <TextField
                    id={`charge-price-${draft.key}`}
                    label={draft.kind === 'extra' ? 'Amount (RSD)' : 'Price (RSD)'}
                    aria-label={`Price of ${lineName}`}
                    compact
                    className={styles.short}
                    invalid={Boolean(errors.unitPrice)}
                    inputMode="decimal"
                    placeholder="0,00"
                    value={draft.unitPrice}
                    onChange={(event) => update(draft.key, { unitPrice: event.target.value })}
                  />
                  {draft.kind === 'medication' && (
                    <TextField
                      id={`charge-dose-${draft.key}`}
                      label="Dose"
                      aria-label={`Dose of ${lineName}`}
                      compact
                      className={styles.wide}
                      invalid={Boolean(errors.dose)}
                      placeholder="0,5 ml x 7 dana"
                      value={draft.dose}
                      onChange={(event) => update(draft.key, { dose: event.target.value })}
                    />
                  )}
                  <span className={styles.lineTotal}>
                    {total === undefined ? '—' : formatPrice(total)}
                  </span>
                </div>

                {draft.vaccine && (
                  <div className={styles.inputs}>
                    <span className={styles.vaccineTag}>
                      {draft.vaccine.isRabies ? 'Rabies vaccine' : 'Vaccine'}
                    </span>
                    <TextField
                      id={`charge-batch-${draft.key}`}
                      label="Batch"
                      aria-label={`Batch of ${lineName}`}
                      compact
                      className={styles.short}
                      invalid={Boolean(errors.batch)}
                      placeholder="A3KZ"
                      value={draft.vaccine.batch}
                      onChange={(event) => updateVaccine(draft, { batch: event.target.value })}
                    />
                    <div className={styles.due}>
                      <DatePicker
                        id={`due-${draft.key}`}
                        label={`Next due for ${lineName}`}
                        hideLabel
                        value={draft.vaccine.dueOn}
                        minDate={addClinicDays(givenOn, 1)}
                        onChange={(dueOn) => updateVaccine(draft, { dueOn })}
                        error={errors.dueOn}
                      />
                      <span className={fieldStyles.label}>Next due</span>
                    </div>
                  </div>
                )}

                {Object.values(errors).length > 0 && (
                  <p className={styles.error} role="alert">
                    {Object.values(errors).join(' · ')}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <div className={styles.adders}>
        <PriceItemPicker
          kind="service"
          onPick={(item) => onChange([...drafts, draftFromItem(item, givenOn)])}
        />
        <PriceItemPicker
          kind="medication"
          onPick={(item) => onChange([...drafts, draftFromItem(item, givenOn)])}
        />
        <Button
          variant="outline"
          type="button"
          className={styles.extraButton}
          onClick={() => onChange([...drafts, extraDraft()])}
        >
          ＋ Additional cost
        </Button>
      </div>

      <div className={styles.footer}>
        <span>Total</span>
        <span className={styles.total} data-testid="charges-total">
          {drafts.length === 0 ? 'No charges' : formatPrice(chargesTotal(drafts))}
        </span>
      </div>
      {totalError && (
        <p className={styles.error} role="alert">
          {totalError}
        </p>
      )}
    </section>
  )
}
