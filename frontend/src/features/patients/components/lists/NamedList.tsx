import { EmptyState, Skeleton } from '@/shared/ui'
import styles from './NamedList.module.css'

export interface NamedListProps {
  label: string
  names: { id: string; name: string }[]
  isLoading: boolean
  limit: number
  hasSearch: boolean
  emptyMessage: string
}

export function NamedList({
  label,
  names,
  isLoading,
  limit,
  hasSearch,
  emptyMessage,
}: NamedListProps) {
  if (isLoading) return <Skeleton height="10rem" />

  if (names.length === 0) {
    return <EmptyState message={hasSearch ? 'Nothing matches your search.' : emptyMessage} />
  }

  return (
    <div className={styles.wrap}>
      <ul className={styles.list} aria-label={label}>
        {names.map((item) => (
          <li key={item.id} className={styles.item}>
            {item.name}
          </li>
        ))}
      </ul>
      {names.length >= limit && (
        <p className={styles.note}>Showing the first {limit}. Search to narrow the list.</p>
      )}
    </div>
  )
}
