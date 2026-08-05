import { useEffect, useState } from 'react'
import { SlidePanel } from '@/shared/ui'
import { getPeakHoursBreakdown, type DayBreakdown, type HourBreakdown, type PeakHoursBreakdown } from '../api/statsApi'
import styles from './PeakHoursPanel.module.css'

export interface PeakHoursPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.tile}>
      <span className={styles.tileLabel}>{label}</span>
      <span className={styles.tileValue}>{value}</span>
    </div>
  )
}

function HourRow({ entry, max, isPeak }: { entry: HourBreakdown; max: number; isPeak: boolean }) {
  const width = max === 0 ? 0 : (entry.count / max) * 100
  return (
    <div className={styles.barRow}>
      <span className={styles.barLabel}>{entry.hour}</span>
      <div className={styles.barTrack}>
        <div
          className={isPeak ? styles.barFillAccent : styles.barFill}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className={styles.barCount}>{entry.count > 0 ? `${entry.count} appt.` : '—'}</span>
    </div>
  )
}

function DayRow({ entry, max, isBusiest }: { entry: DayBreakdown; max: number; isBusiest: boolean }) {
  const width = max === 0 ? 0 : (entry.total / max) * 100
  return (
    <div className={styles.barRow}>
      <span className={styles.barLabel}>{entry.day}</span>
      <div className={styles.barTrack}>
        <div
          className={isBusiest ? styles.barFillAccent : styles.barFill}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className={styles.barCount}>
        {entry.peakHour ? `${entry.peakHour.hour} (${entry.peakHour.count})` : '—'}
      </span>
    </div>
  )
}

export function PeakHoursPanel({ open, onOpenChange }: PeakHoursPanelProps) {
  const [data, setData] = useState<PeakHoursBreakdown | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    getPeakHoursBreakdown().then((result) => {
      if (!cancelled) setData(result)
    })
    return () => {
      cancelled = true
    }
  }, [open])

  const maxHourCount = data ? Math.max(1, ...data.byHour.map((entry) => entry.count)) : 1
  const maxDayTotal = data ? Math.max(1, ...data.byDay.map((entry) => entry.total)) : 1

  return (
    <SlidePanel
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel="Peak Hours"
      header={
        <div>
          <div className={styles.title}>Peak Hours</div>
          <div className={styles.subtitle}>Appointment schedule by hour and day of week.</div>
        </div>
      }
    >
      {!data ? (
        <p className={styles.loading}>Loading…</p>
      ) : (
        <>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Overview</h3>
            <div className={styles.overviewGrid}>
              <Tile label="Peak hour" value={data.peakHour?.hour ?? '—'} />
              <Tile label="Appointments in that hour" value={String(data.peakHour?.count ?? 0)} />
              <Tile label="Busiest day" value={data.busiestDay?.day ?? '—'} />
              <Tile label="Average per day" value={data.averagePerDay.toFixed(1)} />
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Appointments by hour</h3>
            {data.byHour.map((entry) => (
              <HourRow
                key={entry.hour}
                entry={entry}
                max={maxHourCount}
                isPeak={data.peakHour?.hour === entry.hour}
              />
            ))}
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>By day of week — total and peak hour</h3>
            {data.byDay.map((entry) => (
              <DayRow
                key={entry.day}
                entry={entry}
                max={maxDayTotal}
                isBusiest={data.busiestDay?.day === entry.day}
              />
            ))}
            <p className={styles.note}>Based on {data.totalAppointments} appointments.</p>
          </section>
        </>
      )}
    </SlidePanel>
  )
}
