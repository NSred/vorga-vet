import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Combobox, DatePicker, Select, SlidePanel } from '@/shared/ui'

const OPTIONS = Array.from({ length: 40 }, (_, index) => ({
  id: `o${index + 1}`,
  label: `Option ${index + 1}`,
}))

function Fields({ prefix }: { prefix: string }) {
  const [query, setQuery] = useState('')
  const [value, setValue] = useState('o1')
  const [date, setDate] = useState('2026-10-06')

  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
      <Combobox
        id={`${prefix}-combobox`}
        label={`${prefix} combobox`}
        triggerText=""
        query={query}
        onQueryChange={setQuery}
        options={OPTIONS.filter((option) => option.label.includes(query))}
        onSelect={() => undefined}
      />
      <Select
        id={`${prefix}-select`}
        label={`${prefix} select`}
        value={value}
        onChange={setValue}
        options={OPTIONS.map((option) => ({ value: option.id, label: option.label }))}
      />
      <DatePicker id={`${prefix}-date`} label={`${prefix} date`} value={date} onChange={setDate} />
    </div>
  )
}

function Harness() {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <Fields prefix="Page" />
      <button type="button" onClick={() => setOpen(true)}>
        Open panel
      </button>
      <SlidePanel open={open} onOpenChange={setOpen} title="Panel">
        <Fields prefix="Panel" />
      </SlidePanel>
    </div>
  )
}

createRoot(document.getElementById('root') as HTMLElement).render(<Harness />)
