import { Select } from '../Select/Select'
import styles from './Pagination.module.css'

export interface PaginationProps {
  page: number
  pageCount: number
  pageSize: number
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

const WINDOW_SIZE = 5

function getPageWindow(page: number, pageCount: number): number[] {
  if (pageCount <= WINDOW_SIZE) {
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }
  const start = Math.min(Math.max(page - Math.floor(WINDOW_SIZE / 2), 1), pageCount - WINDOW_SIZE + 1)
  return Array.from({ length: WINDOW_SIZE }, (_, index) => start + index)
}

export function Pagination({
  page,
  pageCount,
  pageSize,
  pageSizeOptions = [10, 20, 50],
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const pageWindow = getPageWindow(page, pageCount)

  return (
    <div className={styles.pagination}>
      <div className={styles.pages}>
        <button
          type="button"
          className={styles.arrow}
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          aria-label="First page"
        >
          «
        </button>
        <button
          type="button"
          className={styles.arrow}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          ‹
        </button>
        {pageWindow.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            className={`${styles.pageButton} ${pageNumber === page ? styles.pageButtonActive : ''}`}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}
        <button
          type="button"
          className={styles.arrow}
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          ›
        </button>
        <button
          type="button"
          className={styles.arrow}
          disabled={page >= pageCount}
          onClick={() => onPageChange(pageCount)}
          aria-label="Last page"
        >
          »
        </button>
      </div>
      <Select
        className={styles.pageSize}
        label="Rows per page"
        hideLabel
        value={String(pageSize)}
        onChange={(next) => onPageSizeChange(Number(next))}
        options={pageSizeOptions.map((option) => ({ value: String(option), label: `${option} / page` }))}
      />
    </div>
  )
}
