import { useState } from 'react'

export interface ClosedPanel {
  mode: 'closed'
}

const CLOSED: ClosedPanel = { mode: 'closed' }

export interface PanelStateControls<T> {
  panel: T | ClosedPanel
  displayPanel: T | ClosedPanel
  setPanel: (next: T) => void
  closePanel: () => void
}

export function usePanelState<T extends { mode: string }>(): PanelStateControls<T> {
  const [panel, setPanelState] = useState<T | ClosedPanel>(CLOSED)
  const [displayPanel, setDisplayPanel] = useState<T | ClosedPanel>(CLOSED)
  if (panel.mode !== 'closed' && panel !== displayPanel) {
    setDisplayPanel(panel)
  }

  return {
    panel,
    displayPanel,
    setPanel: setPanelState,
    closePanel: () => setPanelState(CLOSED),
  }
}
