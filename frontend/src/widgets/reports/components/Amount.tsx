import { CURRENCY, formatAmount } from '@/shared/lib/money'
import styles from './Reports.module.css'

export interface AmountProps {
  value: number
  size?: 'normal' | 'large'
}

export function Amount({ value, size = 'normal' }: AmountProps) {
  return (
    <span className={size === 'large' ? styles.amountLarge : styles.amount}>
      {formatAmount(value)} <span className={styles.currency}>{CURRENCY}</span>
    </span>
  )
}
