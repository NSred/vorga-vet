import { Outlet } from 'react-router'
import { useAuth } from '@/features/auth'
import styles from './AppLayout.module.css'

export function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.brand}>VorgaVet</span>
        <div className={styles.userArea}>
          <span>{user?.email}</span>
          <button onClick={logout} className={styles.logoutButton}>
            Log out
          </button>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
