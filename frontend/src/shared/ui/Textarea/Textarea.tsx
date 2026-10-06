import { forwardRef, type TextareaHTMLAttributes } from 'react'
import fieldStyles from '../field.module.css'
import styles from './Textarea.module.css'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  id: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, id, className, rows = 3, ...rest },
  ref,
) {
  return (
    <div className={`${fieldStyles.field} ${className ?? ''}`}>
      <label htmlFor={id} className={fieldStyles.label}>
        {label}
      </label>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        className={`${styles.textarea} ${error ? styles.textareaInvalid : ''}`}
        aria-invalid={Boolean(error) || undefined}
        {...rest}
      />
      {error && (
        <p className={fieldStyles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  )
})
