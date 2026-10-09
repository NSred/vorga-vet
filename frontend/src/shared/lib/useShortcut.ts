import { useEffect, useRef } from 'react'

const EDITABLE = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]'
const OPEN_LAYER = '[role="dialog"], [role="alertdialog"]'

function isEditable(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(EDITABLE) !== null
}

export function useShortcut(key: string | undefined, handler: () => void, enabled = true) {
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  })

  useEffect(() => {
    if (!key || !enabled) return
    const wanted = key.toLowerCase()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey) return
      if (event.key.toLowerCase() !== wanted) return
      if (isEditable(event.target)) return
      if (document.querySelector(OPEN_LAYER)) return

      event.preventDefault()
      handlerRef.current()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [key, enabled])
}
