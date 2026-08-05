import { useLayoutEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/features/auth'
import styles from './AppLayout.module.css'

export function AppLayout() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const patientsLinkRef = useRef<HTMLAnchorElement>(null)
  const appointmentsLinkRef = useRef<HTMLAnchorElement>(null)
  const [thumbStyle, setThumbStyle] = useState<{ left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    const activeLink = pathname === '/' ? patientsLinkRef.current : appointmentsLinkRef.current
    if (activeLink) {
      setThumbStyle({ left: activeLink.offsetLeft, width: activeLink.offsetWidth })
    }
  }, [pathname])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.brand}>VorgaVet</span>
          <nav className={styles.nav}>
            {thumbStyle && (
              <span
                className={styles.navThumb}
                style={{ left: thumbStyle.left, width: thumbStyle.width }}
              />
            )}
            <NavLink
              to="/"
              end
              ref={patientsLinkRef}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
            >
              Patient Records
            </NavLink>
            <NavLink
              to="/appointments"
              ref={appointmentsLinkRef}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
            >
              Appointments
            </NavLink>
          </nav>
        </div>
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
