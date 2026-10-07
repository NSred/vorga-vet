import { Button } from '../Button/Button'
import styles from './RetireRestoreButton.module.css'

export interface RetireRestoreButtonProps {
  isActive: boolean
  onRetire: () => void
  onRestore: () => void
  disabled?: boolean
}

export function RetireRestoreButton({
  isActive,
  onRetire,
  onRestore,
  disabled,
}: RetireRestoreButtonProps) {
  return (
    <div className={styles.action}>
      {isActive ? (
        <Button variant="danger" type="button" onClick={onRetire} disabled={disabled}>
          Retire
        </Button>
      ) : (
        <Button variant="outline" type="button" onClick={onRestore} disabled={disabled}>
          Restore
        </Button>
      )}
    </div>
  )
}
