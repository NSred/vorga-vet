import { useState, type CSSProperties } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import type { AuthOutletContext, MascotPose } from '@/features/auth/context/AuthLayoutContext'
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

function YorkshireMascot({ pose }: { pose: MascotPose }) {
  const isCovering = pose === 'covering' || pose === 'peeking'
  return (
    <div
      className={`${styles.mascot} ${isCovering ? styles.mascotCovering : ''} ${pose === 'peeking' ? styles.mascotPeeking : ''}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 120 120">
        <g>
          <path
            d="M33 50C24 48 16 41 17 30 17 25 20 21 25 20L30 17C31 23 35 29 39 35 43 39 47 42 50 45 44 49 38 51 33 50Z"
            fill="#b98d5c"
          />
          <path
            d="M87 50C96 48 104 41 103 30 103 25 100 21 95 20L90 17C89 23 85 29 81 35 77 39 73 42 70 45 76 49 82 51 87 50Z"
            fill="#b98d5c"
          />
          <path d="M27 23c-2.5-2.5-2.5-6.5 0-9 2.5 2.5 2.5 6.5 0 9Z" fill="#c9a06a" />
          <path d="M93 23c2.5-2.5 2.5-6.5 0-9-2.5 2.5-2.5 6.5 0 9Z" fill="#c9a06a" />
          <path
            d="M33 45C24 42 17 33 19 22 23 25 27 27 30 27 30 31 32 34 34 36 34 39 33 42 33 45Z"
            fill="#8f6a44"
          />
          <path
            d="M87 45C96 42 103 33 101 22 97 25 93 27 90 27 90 31 88 34 86 36 86 39 87 42 87 45Z"
            fill="#8f6a44"
          />
          <path d="M20 64c-4-2-6-6-5-10 4 1 7 4 8 8Z" fill="#d9cbae" />
          <path d="M20 78c-4-1-7-4-7-8 4 0 7 3 9 6Z" fill="#d9cbae" />
          <path d="M100 64c4-2 6-6 5-10-4 1-7 4-8 8Z" fill="#d9cbae" />
          <path d="M100 78c4-1 7-4 7-8-4 0-7 3-9 6Z" fill="#d9cbae" />
          <path d="M22 56q-6 40 8 60h14Q34 92 34 56Z" fill="#e3d6bd" />
          <path d="M98 56q6 40-8 60H76q10-24 10-60Z" fill="#e3d6bd" />
          <path
            d="M60 26C80 26 96 40 96 60 96 82 82 102 60 106 38 102 24 82 24 60 24 40 40 26 60 26Z"
            fill="#efe4cd"
          />
          <path
            d="M60 28C72 28 80 33 83 42 76 37 70 35 65 36 63 37 61 38 60 38 59 38 57 37 55 36 50 35 44 37 37 42 40 33 48 28 60 28Z"
            fill="#9aa5b0"
          />
          <path d="M46 40q5 7 14 7t14-7q-2 10-14 11T46 40Z" fill="#b3bcc5" />
          <ellipse cx="60" cy="80" rx="18" ry="14" fill="#f6efdf" />
          <ellipse cx="45" cy="61" rx="9" ry="8.6" fill="#3a2c22" />
          <ellipse cx="75" cy="61" rx="9" ry="8.6" fill="#3a2c22" />
          <g>
            <circle cx="45" cy="62" r="5.3" fill="#140f0b" />
            <circle cx="75" cy="62" r="5.3" fill="#140f0b" />
            <ellipse cx="42.3" cy="58.5" rx="2.4" ry="2.9" fill="#fff" opacity=".92" />
            <ellipse cx="72.3" cy="58.5" rx="2.4" ry="2.9" fill="#fff" opacity=".92" />
            <circle cx="47.8" cy="64.5" r="1.1" fill="#fff" opacity=".75" />
            <circle cx="77.8" cy="64.5" r="1.1" fill="#fff" opacity=".75" />
          </g>
          <ellipse cx="60" cy="75" rx="6.8" ry="5.3" fill="#231c17" />
          <path
            d="M60 80v4m0 0q-5 4-9 1m9-1q5 4 9 1"
            stroke="#3a2c22"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M56 88q4 7 8 0Z" fill="#e08b93" />
        </g>
        <g className={styles.mascotPaws}>
          <g className={styles.mascotPawLeft}>
            <path d="m12 128 32-70" stroke="#c9b18a" strokeWidth="22" strokeLinecap="round" />
            <circle cx="44" cy="57" r="11" fill="#dcc7a1" />
            <g fill="#a98e64">
              <circle cx="39" cy="51" r="2.6" />
              <circle cx="45" cy="49" r="2.6" />
              <circle cx="51" cy="52" r="2.6" />
            </g>
          </g>
          <g className={styles.mascotPawRight}>
            <path d="m108 128-32-70" stroke="#c9b18a" strokeWidth="22" strokeLinecap="round" />
            <circle cx="76" cy="57" r="11" fill="#dcc7a1" />
            <g fill="#a98e64">
              <circle cx="71" cy="51" r="2.6" />
              <circle cx="77" cy="49" r="2.6" />
              <circle cx="83" cy="52" r="2.6" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  )
}

export function AuthLayout() {
  const { pathname } = useLocation()
  const mode: AuthMode = pathname === '/register' ? 'register' : 'login'
  const [mascotState, setMascotState] = useState<{ mode: AuthMode; pose: MascotPose }>({
    mode,
    pose: 'idle',
  })
  const mascotPose: MascotPose = mascotState.mode === mode ? mascotState.pose : 'idle'

  const outletContext: AuthOutletContext = {
    setMascotPose: (pose) => setMascotState({ mode, pose }),
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
        <YorkshireMascot pose={mascotPose} />
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
