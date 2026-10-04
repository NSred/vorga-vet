import type { CSSProperties } from 'react'
import styles from './Skeleton.module.css'

export interface SkeletonProps {
  width?: string | number
  height?: string | number
  className?: string
}

export function Skeleton({ width = '100%', height = '1rem', className }: SkeletonProps) {
  const style: CSSProperties = { width, height }
  return <span aria-hidden="true" className={`${styles.skeleton} ${className ?? ''}`} style={style} />
}
