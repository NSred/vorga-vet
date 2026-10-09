import { useState, type FormEvent } from 'react'
import { clinicDateOf } from '@/shared/lib/clinicTime'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import { formatAmount, formatEuro, formatPrice } from '@/shared/lib/money'
import { Button, FormError, Skeleton, TextField, useToast } from '@/shared/ui'
import { useExchangeRate, useSetExchangeRate } from '../hooks/useExchangeRate'
import { parsePrice, rateError } from '../lib/price'
import styles from './ExchangeRateTab.module.css'

const EXAMPLE_PRICE = 1500

export function ExchangeRateTab() {
  const { showToast } = useToast()
  const query = useExchangeRate()
  const save = useSetExchangeRate()
  const [draft, setDraft] = useState<string | null>(null)
  const [error, setError] = useState<string | undefined>(undefined)
  const [submitError, setSubmitError] = useState<string | undefined>(undefined)

  if (query.isPending) return <Skeleton height="8rem" />

  const stored = query.data?.rsdPerEur ?? null
  const updatedAt = query.data?.updatedAt ?? null
  const text = draft ?? (stored === null ? '' : formatAmount(stored))

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const problem = rateError(text)
    setError(problem)
    setSubmitError(undefined)
    if (problem) return

    save.mutate(parsePrice(text) as number, {
      onSuccess: () => {
        setDraft(null)
        showToast({ tone: 'success', title: 'Euro rate saved' })
      },
      onError: () => setSubmitError('Could not save the euro rate.'),
    })
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={styles.row}>
        <TextField
          id="rsd-per-eur"
          label="Dinars for one euro"
          suffix="RSD"
          inputMode="decimal"
          placeholder="117,20"
          value={text}
          error={error}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button type="submit" variant="primary" disabled={save.isPending}>
          Save
        </Button>
      </div>

      {stored === null ? (
        <p className={styles.note}>
          No rate yet. Once it is set, the price list shows each price in euros as well.
        </p>
      ) : (
        <p className={styles.note}>
          {formatPrice(EXAMPLE_PRICE)} is {formatEuro(EXAMPLE_PRICE, stored)}
          {updatedAt && ` · last changed ${formatDisplayDate(clinicDateOf(updatedAt))}`}
        </p>
      )}
      <FormError message={submitError} />
    </form>
  )
}
