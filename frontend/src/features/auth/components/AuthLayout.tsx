import { useState, type CSSProperties } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import type { AuthOutletContext } from '@/features/auth/context/AuthLayoutContext'
import styles from './AuthForm.module.css'

type AuthMode = 'login' | 'register'

const pawPrints = [
  { left: '7%', delay: '-8s', duration: '34s', size: '1.3rem', rotation: '-18deg' },
  { left: '18%', delay: '-25s', duration: '42s', size: '1.7rem', rotation: '14deg' },
  { left: '31%', delay: '-14s', duration: '38s', size: '1.1rem', rotation: '-8deg' },
  { left: '47%', delay: '-33s', duration: '48s', size: '1.5rem', rotation: '24deg' },
  { left: '61%', delay: '-19s', duration: '36s', size: '1.2rem', rotation: '-22deg' },
  { left: '75%', delay: '-29s', duration: '44s', size: '1.8rem', rotation: '9deg' },
  { left: '89%', delay: '-12s', duration: '40s', size: '1.25rem', rotation: '-13deg' },
]

function YorkshireMascot({ isCovering }: { isCovering: boolean }) {
  return (
    <div
      className={`${styles.mascot} ${isCovering ? styles.mascotCovering : ''}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 120 120">
        <g>
          <path d="M24 44 30 12l22 22Z" fill="#b98d5c" />
          <path d="m96 44-6-32-22 22Z" fill="#b98d5c" />
          <path d="m28 40 4-20 14 14Z" fill="#8f6a44" />
          <path d="m92 40-4-20-14 14Z" fill="#8f6a44" />
          <path d="M22 52q-4 40 10 62h20Q38 84 40 52Z" fill="#e3d6bd" />
          <path d="M98 52q4 40-10 62H68q14-30 12-62Z" fill="#e3d6bd" />
          <path
            d="M60 24q30 0 32 32 2 32-12 46-9 9-20 9t-20-9Q26 88 28 56q2-32 32-32Z"
            fill="#efe4cd"
          />
          <path
            d="M60 24q26 0 31 27-8-9-16-11-7 6-15 6t-15-6q-8 2-16 11 5-27 31-27Z"
            fill="#9aa5b0"
          />
          <path d="M44 40q6 8 16 8t16-8q-4 12-16 13T44 40Z" fill="#b3bcc5" />
          <ellipse cx="60" cy="79" rx="17" ry="13" fill="#f6efdf" />
          <ellipse cx="46" cy="60" rx="7.4" ry="7" fill="#3a2c22" />
          <ellipse cx="74" cy="60" rx="7.4" ry="7" fill="#3a2c22" />
          <g className={styles.pupils}>
            <circle cx="46" cy="60" r="4.4" fill="#140f0b" />
            <circle cx="44.1" cy="57.9" r="1.7" fill="#fff" opacity=".85" />
            <circle cx="74" cy="60" r="4.4" fill="#140f0b" />
            <circle cx="72.1" cy="57.9" r="1.7" fill="#fff" opacity=".85" />
          </g>
          <ellipse className={styles.eyelid} cx="46" cy="60" rx="8.6" ry="8.2" fill="#efe4cd" />
          <ellipse className={styles.eyelid} cx="74" cy="60" rx="8.6" ry="8.2" fill="#efe4cd" />
          <ellipse cx="60" cy="74" rx="6.6" ry="5.2" fill="#231c17" />
          <path
            d="M60 79v4m0 0q-5 4-9 1m9-1q5 4 9 1"
            stroke="#3a2c22"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M56 87q4 7 8 0Z" fill="#e08b93" />
        </g>
        <g className={styles.mascotPaws}>
          <path d="m12 128 32-70" stroke="#c9b18a" strokeWidth="22" strokeLinecap="round" />
          <path d="m108 128-32-70" stroke="#c9b18a" strokeWidth="22" strokeLinecap="round" />
          <circle cx="44" cy="57" r="11" fill="#dcc7a1" />
          <circle cx="76" cy="57" r="11" fill="#dcc7a1" />
          <g fill="#a98e64">
            <circle cx="39" cy="51" r="2.6" />
            <circle cx="45" cy="49" r="2.6" />
            <circle cx="51" cy="52" r="2.6" />
            <circle cx="71" cy="51" r="2.6" />
            <circle cx="77" cy="49" r="2.6" />
            <circle cx="83" cy="52" r="2.6" />
          </g>
        </g>
      </svg>
    </div>
  )
}

export function AuthLayout() {
  const { pathname } = useLocation()
  const mode: AuthMode = pathname === '/register' ? 'register' : 'login'
  const [mascotState, setMascotState] = useState({ mode, isCovering: false })
  const mascotIsCovering = mascotState.mode === mode && mascotState.isCovering

  const outletContext: AuthOutletContext = {
    setMascotIsCovering: (isCovering) => setMascotState({ mode, isCovering }),
  }

  return (
    <main className={styles.page}>
      <div className={styles.backgroundGlow} />
      <div className={styles.floatingPaws} aria-hidden="true">
        {pawPrints.map((paw) => (
          <span
            key={paw.left}
            style={
              {
                left: paw.left,
                animationDelay: paw.delay,
                animationDuration: paw.duration,
                fontSize: paw.size,
                '--paw-rotation': paw.rotation,
              } as CSSProperties
            }
          >
            🐾
          </span>
        ))}
      </div>

      <section className={styles.card} aria-labelledby="auth-title">
        <YorkshireMascot isCovering={mascotIsCovering} />
        <div className={styles.wordmark}>
          VorgaVet
          <span>Veterinary clinic</span>
        </div>

        <h1 id="auth-title" className={styles.heading}>
          Welcome
        </h1>

        <nav className={styles.segmentedControl} aria-label="Authentication">
          <span
            className={`${styles.segmentThumb} ${mode === 'register' ? styles.segmentThumbRight : ''}`}
          />
          <Link
            to="/login"
            className={`${styles.segmentLink} ${mode === 'login' ? styles.segmentActive : ''}`}
            aria-current={mode === 'login' ? 'page' : undefined}
          >
            Log in
          </Link>
          <Link
            to="/register"
            className={`${styles.segmentLink} ${mode === 'register' ? styles.segmentActive : ''}`}
            aria-current={mode === 'register' ? 'page' : undefined}
          >
            Register
          </Link>
        </nav>

        <div className={styles.formPane}>
          <Outlet context={outletContext} />
        </div>
      </section>
    </main>
  )
}
