import { useLayoutEffect, useRef, useState } from 'react'
import styles from './SegmentedControl.module.css'

export interface SegmentedControlOption<T extends string> {
  value: T
  label: string
  count?: number
}

export interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: readonly SegmentedControlOption<T>[]
  labelledBy?: string
  fullWidth?: boolean
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  labelledBy,
  fullWidth = false,
}: SegmentedControlProps<T>) {
  const buttonRefs = useRef(new Map<T, HTMLButtonElement>())
  const [thumbStyle, setThumbStyle] = useState<{ left: number; width: number } | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const measure = () => {
      const activeButton = buttonRefs.current.get(value)
      if (!activeButton) return
      const left = activeButton.offsetLeft
      const width = activeButton.offsetWidth
      setThumbStyle((current) =>
        current && current.left === left && current.width === width ? current : { left, width },
      )
    }

    measure()

    const container = containerRef.current
    if (!container || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    buttonRefs.current.forEach((button) => observer.observe(button))
    return () => observer.disconnect()
  }, [value, options.length])

  return (
    <div
      className={`${styles.segmented} ${fullWidth ? styles.fullWidth : ''}`}
      ref={containerRef}
      role={labelledBy ? 'group' : undefined}
      aria-labelledby={labelledBy}
    >
      {thumbStyle && (
        <span className={styles.thumb} style={{ left: thumbStyle.left, width: thumbStyle.width }} />
      )}
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          ref={(element) => {
            if (element) buttonRefs.current.set(option.value, element)
            else buttonRefs.current.delete(option.value)
          }}
          aria-pressed={value === option.value}
          className={`${styles.segment} ${value === option.value ? styles.segmentActive : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {option.count !== undefined && (
            <>
              {' '}
              <span className={styles.count}>{option.count}</span>
            </>
          )}
        </button>
      ))}
    </div>
  )
}
