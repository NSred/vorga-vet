import { useEffect, useRef, useState } from 'react'
import { useDebouncedValue } from './useDebouncedValue'

export function useSearchDraft(
  committed: string,
  onCommit: (search: string) => void,
  delayMs = 300,
): [string, (draft: string) => void] {
  const [draft, setDraft] = useState(committed)
  const debounced = useDebouncedValue(draft, delayMs)
  const onCommitRef = useRef(onCommit)

  useEffect(() => {
    onCommitRef.current = onCommit
  }, [onCommit])

  useEffect(() => {
    if (debounced !== draft || debounced === committed) return
    onCommitRef.current(debounced)
  }, [debounced, draft, committed])

  return [draft, setDraft]
}
