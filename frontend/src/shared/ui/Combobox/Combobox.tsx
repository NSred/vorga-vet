import * as Popover from '@radix-ui/react-popover'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import fieldStyles from '../field.module.css'
import styles from './Combobox.module.css'

export interface ComboboxOption {
  id: string
  label: string
  hint?: string
}

export interface ComboboxProps {
  id?: string
  label: string
  triggerText: string
  placeholder?: string
  query: string
  onQueryChange: (query: string) => void
  options: ComboboxOption[]
  onSelect: (option: ComboboxOption) => void
  onCreate?: (query: string) => void
  onClear?: () => void
  createLabel?: string
  selectedIds?: string[]
  isLoading?: boolean
  errorMessage?: string
  emptyMessage?: string
  disabled?: boolean
  error?: string
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
  onOpen?: () => void
}

const LOAD_MORE_DISTANCE_PX = 48

export function Combobox({
  id,
  label,
  triggerText,
  placeholder = 'Search…',
  query,
  onQueryChange,
  options,
  onSelect,
  onCreate,
  onClear,
  createLabel = 'Create',
  selectedIds = [],
  isLoading = false,
  errorMessage,
  emptyMessage = 'No matches',
  disabled = false,
  error,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  onOpen,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const trimmedQuery = query.trim()
  const showCreate = Boolean(onCreate) && trimmedQuery.length > 0
  const rowCount = options.length + (showCreate ? 1 : 0)
  const canLoadMore = Boolean(onLoadMore) && hasMore && !isLoadingMore && !isLoading

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    setActiveIndex((index) => Math.min(index, Math.max(rowCount - 1, 0)))
  }, [rowCount])

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView?.({ block: 'nearest' })
  }, [activeIndex])

  function loadMoreNearEnd(list: HTMLDivElement) {
    const distance = list.scrollHeight - list.scrollTop - list.clientHeight
    if (canLoadMore && distance <= LOAD_MORE_DISTANCE_PX) onLoadMore?.()
  }

  function commit(index: number) {
    if (showCreate && index === options.length) {
      onCreate?.(trimmedQuery)
      setOpen(false)
      return
    }

    const option = options[index]
    if (option) {
      onSelect(option)
      setOpen(false)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (rowCount === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (hasMore && activeIndex >= options.length - 3 && canLoadMore) onLoadMore?.()
      setActiveIndex((index) =>
        hasMore ? Math.min(index + 1, rowCount - 1) : (index + 1) % rowCount,
      )
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index - 1 + rowCount) % rowCount)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      commit(activeIndex)
    }
  }

  return (
    <div className={fieldStyles.field}>
      <label htmlFor={id} className={fieldStyles.label}>
        {label}
      </label>

      <Popover.Root
        open={open}
        onOpenChange={(next) => {
          if (disabled) return
          setOpen(next)
          if (next) onOpen?.()
        }}
      >
        <Popover.Trigger asChild>
          <button
            id={id}
            type="button"
            disabled={disabled}
            aria-label={label}
            className={`${styles.trigger} ${error ? styles.triggerInvalid : ''}`}
          >
            <span className={triggerText ? styles.value : styles.placeholder}>
              {triggerText || placeholder}
            </span>
            <span className={styles.icon} aria-hidden="true">
              ▾
            </span>
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            className={styles.content}
            align="start"
            sideOffset={6}
            onOpenAutoFocus={(event) => {
              event.preventDefault()
              inputRef.current?.focus()
            }}
          >
            <input
              ref={inputRef}
              className={styles.search}
              value={query}
              placeholder={placeholder}
              aria-label={`Search ${label}`}
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyDown={handleKeyDown}
            />

            <div
              ref={listRef}
              className={styles.list}
              role="listbox"
              aria-label={label}
              onScroll={(event) => loadMoreNearEnd(event.currentTarget)}
            >
              {onClear && (
                <button
                  type="button"
                  className={styles.clearRow}
                  onClick={() => {
                    onClear()
                    setOpen(false)
                  }}
                >
                  Clear selection
                </button>
              )}

              {isLoading && <p className={styles.state}>Searching…</p>}

              {!isLoading && errorMessage && <p className={styles.stateError}>{errorMessage}</p>}

              {!isLoading && !errorMessage && options.length === 0 && !showCreate && (
                <p className={styles.state}>{emptyMessage}</p>
              )}

              {!isLoading &&
                !errorMessage &&
                options.map((option, index) => (
                  <button
                    key={option.id}
                    type="button"
                    role="option"
                    data-index={index}
                    aria-selected={selectedIds.includes(option.id)}
                    className={`${styles.option} ${index === activeIndex ? styles.active : ''}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => commit(index)}
                  >
                    <span className={styles.optionLabel}>{option.label}</span>
                    {option.hint && <span className={styles.hint}>{option.hint}</span>}
                    {selectedIds.includes(option.id) && (
                      <span className={styles.check} aria-hidden="true">
                        ✓
                      </span>
                    )}
                  </button>
                ))}

              {!isLoading && !errorMessage && isLoadingMore && (
                <p className={styles.state}>Loading more…</p>
              )}

              {showCreate && (
                <button
                  type="button"
                  className={`${styles.create} ${activeIndex === options.length ? styles.active : ''}`}
                  onMouseEnter={() => setActiveIndex(options.length)}
                  onClick={() => commit(options.length)}
                >
                  ＋ {createLabel} "{trimmedQuery}"
                </button>
              )}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {error && <p className={fieldStyles.error}>{error}</p>}
    </div>
  )
}
