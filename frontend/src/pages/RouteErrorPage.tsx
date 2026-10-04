import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { EmptyState } from '@/shared/ui'
import styles from './RouteErrorPage.module.css'

function titleOf(error: unknown): string {
  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}`.trim()
  }

  return 'Something went wrong'
}

export function RouteErrorPage() {
  const error = useRouteError()

  return (
    <main className={styles.page}>
      <EmptyState message={titleOf(error)} action={<Link to="/patients">Back to patients</Link>} />
    </main>
  )
}
