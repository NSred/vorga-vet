import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { reloadPage } from '@/shared/lib/reloadPage'
import { Button, EmptyState } from '@/shared/ui'
import styles from './RouteErrorPage.module.css'

const FAILED_PAGE_LOAD = /dynamically imported module|importing a module script failed/i

function isFailedPageLoad(error: unknown): boolean {
  return error instanceof Error && FAILED_PAGE_LOAD.test(error.message)
}

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
      {isFailedPageLoad(error) ? (
        <EmptyState
          message="VorgaVet was updated"
          hint="Reload to get the new version."
          action={
            <Button type="button" onClick={reloadPage}>
              Reload
            </Button>
          }
        />
      ) : (
        <EmptyState
          message={titleOf(error)}
          action={<Link to="/patients">Back to patients</Link>}
        />
      )}
    </main>
  )
}
