import { Badge } from '@/shared/ui'
import { hasCharge } from '../lib/visitLabels'
import type { Examination } from '../types'

export function PaymentBadge({ examination }: { examination: Examination }) {
  if (examination.isPaid) return <Badge tone="ok">Paid</Badge>
  if (hasCharge(examination)) return <Badge tone="warn">Unpaid</Badge>
  return <Badge tone="neutral">No cost</Badge>
}
