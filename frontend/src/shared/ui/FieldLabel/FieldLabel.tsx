import fieldStyles from '../field.module.css'

export interface FieldLabelProps {
  text: string
  htmlFor?: string
}

const REQUIRED_MARK = ' *'

export function FieldLabel({ text, htmlFor }: FieldLabelProps) {
  const required = text.endsWith(REQUIRED_MARK)
  const base = required ? text.slice(0, -REQUIRED_MARK.length) : text

  return (
    <label htmlFor={htmlFor} className={fieldStyles.label}>
      {base}
      {required && (
        <>
          {' '}
          <span className={fieldStyles.required}>*</span>
        </>
      )}
    </label>
  )
}
