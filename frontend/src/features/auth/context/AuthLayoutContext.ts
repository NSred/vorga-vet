import { useOutletContext } from 'react-router'

export interface AuthOutletContext {
  setMascotIsCovering: (isCovering: boolean) => void
}

export function useAuthOutlet(): AuthOutletContext {
  return useOutletContext<AuthOutletContext>()
}
