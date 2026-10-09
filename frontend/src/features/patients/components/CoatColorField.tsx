import { coatColorOf, COAT_COLORS } from '@/shared/domain/coatColors'
import { TextField } from '@/shared/ui'
import styles from './CoatColorField.module.css'

export interface CoatColorFieldProps {
  id: string
  value: string
  onChange: (value: string) => void
}

export function CoatColorField({ id, value, onChange }: CoatColorFieldProps) {
  const selected = coatColorOf(value)
  const listId = `${id}-suggestions`

  return (
    <div className={styles.field}>
      <TextField
        id={id}
        label="Color"
        value={value}
        list={listId}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
      />
      <datalist id={listId}>
        {COAT_COLORS.map((color) => (
          <option key={color.name} value={color.name} />
        ))}
      </datalist>
      <div className={styles.swatches} role="group" aria-label="Common coat colors">
        {COAT_COLORS.map((color) => (
          <button
            key={color.name}
            type="button"
            tabIndex={-1}
            className={styles.swatch}
            style={{ background: color.swatch }}
            aria-label={color.name}
            aria-pressed={selected?.name === color.name}
            title={color.name}
            onClick={() => onChange(color.name)}
          />
        ))}
      </div>
    </div>
  )
}
