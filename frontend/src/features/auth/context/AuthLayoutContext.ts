import { useOutletContext } from 'react-router'

export type MascotPose = 'idle' | 'covering' | 'peeking'

export interface AuthOutletContext {
  setMascotPose: (pose: MascotPose) => void
}

export function useAuthOutlet(): AuthOutletContext {
  return useOutletContext<AuthOutletContext>()
}
