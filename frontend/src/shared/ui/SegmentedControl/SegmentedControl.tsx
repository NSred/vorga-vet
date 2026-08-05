import { useLayoutEffect, useRef, useState } from 'react'
import styles from './SegmentedControl.module.css'

export interface SegmentedControlOption<T extends string> {
  value: T
  label: string
}

export interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: readonly SegmentedControlOption<T>[]
}

export function SegmentedControl<T extends string>({ value, onChange, options }: SegmentedControlProps<T>) {
  const buttonRefs = useRef(new Map<T, HTMLButtonElement>())
  const [thumbStyle, setThumbStyle] = useState<{ left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    const activeButton = buttonRefs.current.get(value)
    if (activeButton) {
      setThumbStyle({ left: activeButton.offsetLeft, width: activeButton.offsetWidth })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, options.length])

  return (
    <div className={styles.segmented}>
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
          className={`${styles.segment} ${value === option.value ? styles.segmentActive : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
