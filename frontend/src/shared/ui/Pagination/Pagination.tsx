import styles from './Pagination.module.css'

export interface PaginationProps {
  page: number
  pageCount: number
  pageSize: number
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export function Pagination({
  page,
  pageCount,
  pageSize,
  pageSizeOptions = [10, 20, 50],
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  return (
    <div className={styles.pagination}>
      <div className={styles.pages}>
        <button
          type="button"
          className={styles.arrow}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Prethodna strana"
        >
          ‹
        </button>
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
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
          aria-label="Sledeća strana"
        >
          ›
        </button>
      </div>
      <select
        className={styles.pageSizeSelect}
        value={pageSize}
        onChange={(event) => onPageSizeChange(Number(event.target.value))}
        aria-label="Broj redova po strani"
      >
        {pageSizeOptions.map((option) => (
          <option key={option} value={option}>
            {option} / str.
          </option>
        ))}
      </select>
    </div>
  )
}
