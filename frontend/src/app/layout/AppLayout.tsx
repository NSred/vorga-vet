import { useLayoutEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/features/auth'
import styles from './AppLayout.module.css'

const NAV_ITEMS = [
  { to: '/patients', label: 'Patient Records', vetOnly: false },
  { to: '/appointments', label: 'Appointments', vetOnly: false },
  { to: '/price-list', label: 'Price list', vetOnly: true },
  { to: '/lists', label: 'Lists', vetOnly: true },
  { to: '/reminders', label: 'Reminders', vetOnly: true },
  { to: '/reports', label: 'Reports', vetOnly: true },
]

export function AppLayout() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const navRef = useRef<HTMLElement>(null)
  const [thumbStyle, setThumbStyle] = useState<{ left: number; width: number } | null>(null)
  const isVeterinarian = user?.role === 'veterinarian'
  const navItems = NAV_ITEMS.filter((item) => !item.vetOnly || isVeterinarian)

  useLayoutEffect(() => {
    const measure = () => {
      const activeLink = navRef.current?.querySelector<HTMLAnchorElement>('[aria-current="page"]')
      setThumbStyle(
        activeLink ? { left: activeLink.offsetLeft, width: activeLink.offsetWidth } : null,
      )
      return activeLink
    }

    measure()?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [pathname])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">
              V
            </span>
            VorgaVet
          </span>
          <nav className={styles.nav} ref={navRef} aria-label="Main">
            {thumbStyle && (
              <span
                className={styles.navThumb}
                style={{ left: thumbStyle.left, width: thumbStyle.width }}
              />
            )}
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className={styles.userArea}>
          <span className={styles.userEmail} title={user?.email}>
            {user?.email}
          </span>
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
