import { useLayoutEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/features/auth'
import styles from './AppLayout.module.css'

export function AppLayout() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const navRef = useRef<HTMLElement>(null)
  const [thumbStyle, setThumbStyle] = useState<{ left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    const activeLink = navRef.current?.querySelector<HTMLAnchorElement>('[aria-current="page"]')
    setThumbStyle(
      activeLink ? { left: activeLink.offsetLeft, width: activeLink.offsetWidth } : null,
    )
  }, [pathname])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.brand}>VorgaVet</span>
          <nav className={styles.nav} ref={navRef}>
            {thumbStyle && (
              <span
                className={styles.navThumb}
                style={{ left: thumbStyle.left, width: thumbStyle.width }}
              />
            )}
            <NavLink
              to="/patients"
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
            >
              Patient Records
            </NavLink>
            <NavLink
              to="/appointments"
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
