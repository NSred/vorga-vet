import { useId, useLayoutEffect, useRef, useState } from 'react'
import { FieldLabel } from '../FieldLabel/FieldLabel'
import fieldStyles from '../field.module.css'
import styles from './SegmentedControl.module.css'

export interface SegmentedControlOption<T extends string> {
  value: T
  label: string
}

export interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: readonly SegmentedControlOption<T>[]
  label?: string
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
}: SegmentedControlProps<T>) {
  const labelId = useId()
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

  const control = (
    <div
      className={`${styles.segmented} ${label ? styles.fullWidth : ''}`}
      ref={containerRef}
      role={label ? 'group' : undefined}
      aria-labelledby={label ? labelId : undefined}
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
        </button>
      ))}
    </div>
  )

  if (!label) return control

  return (
    <div className={fieldStyles.field}>
      <FieldLabel id={labelId} text={label} />
      {control}
    </div>
  )
}
