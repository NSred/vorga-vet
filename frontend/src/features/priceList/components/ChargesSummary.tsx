import { formatPrice, formatQuantity } from '@/shared/lib/money'
import { useExaminationChargesQuery } from '../hooks/useExaminationChargesQuery'
import { lineTotal } from '../lib/charges'
import styles from './ChargesSummary.module.css'

export interface ChargesSummaryProps {
  examinationId: string
}

export function ChargesSummary({ examinationId }: ChargesSummaryProps) {
  const { data } = useExaminationChargesQuery(examinationId)

  if (!data || data.length === 0) return null

  return (
    <ul className={styles.lines} aria-label="Charges">
      {data.map((line) => (
        <li key={line.id} className={styles.line}>
          <span className={styles.name}>
            {line.name}
            {line.dose && <span className={styles.dose}> · {line.dose}</span>}
          </span>
          <span className={styles.amount}>
            {line.quantity !== 1 && `${formatQuantity(line.quantity)} × `}
            {formatPrice(lineTotal(line))}
          </span>
        </li>
      ))}
    </ul>
  )
}
