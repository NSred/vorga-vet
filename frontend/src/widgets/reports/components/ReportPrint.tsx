import { printedAtSr } from '../lib/reportLabels'
import styles from './ReportPrint.module.css'

export interface ReportPrintColumn {
  label: string
  numeric?: boolean
}

export interface ReportPrintProps {
  title: string
  columns: ReportPrintColumn[]
  rows: string[][]
  totals: [string, string][]
}

export function ReportPrint({ title, columns, rows, totals }: ReportPrintProps) {
  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.printed}>{printedAtSr()}</p>
      </header>

      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.label} className={column.numeric ? styles.numeric : undefined}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, rowIndex) => (
            <tr key={rowIndex}>
              {cells.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={columns[cellIndex]?.numeric ? styles.numeric : undefined}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <dl className={styles.totals}>
        {totals.map(([label, value]) => (
          <div key={label} className={styles.total}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  )
}
