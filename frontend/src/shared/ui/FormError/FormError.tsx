import styles from './FormError.module.css'

export interface FormErrorProps {
  message?: string
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null

  return (
    <p role="alert" className={styles.error}>
      {message}
    </p>
  )
}
