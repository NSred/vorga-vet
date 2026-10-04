import { Link } from 'react-router'
import { EmptyState } from '@/shared/ui'

export function NotFoundPage() {
  return (
    <EmptyState message="Page not found" action={<Link to="/patients">Back to patients</Link>} />
  )
}
