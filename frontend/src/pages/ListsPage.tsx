import { useSearchParams } from 'react-router'
import { PageHeader, SegmentedControl } from '@/shared/ui'
import { DiagnosesTab } from '@/features/diagnoses'
import { AllergensTab, BreedsTab } from '@/features/patients'
import styles from './ListsPage.module.css'

type ListTab = 'diagnoses' | 'breeds' | 'allergens'

const TAB_OPTIONS = [
  { value: 'diagnoses', label: 'Diagnoses' },
  { value: 'breeds', label: 'Breeds' },
  { value: 'allergens', label: 'Allergens' },
] as const

const SUBTITLES: Record<ListTab, string> = {
  diagnoses: 'The diagnoses the exam form offers. Typed diagnoses can be added from the exam too.',
  breeds: 'The breeds the patient form offers, per species.',
  allergens: 'The allergens the patient form offers.',
}

function tabOf(value: string | null): ListTab {
  return value === 'breeds' || value === 'allergens' ? value : 'diagnoses'
}

export function ListsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = tabOf(searchParams.get('tab'))

  return (
    <div className={styles.page}>
      <PageHeader title="Lists" subtitle={SUBTITLES[tab]} />

      <SegmentedControl
        value={tab}
        onChange={(next) =>
          setSearchParams(next === 'diagnoses' ? {} : { tab: next }, { replace: true })
        }
        options={TAB_OPTIONS}
      />

      {tab === 'diagnoses' && <DiagnosesTab />}
      {tab === 'breeds' && <BreedsTab />}
      {tab === 'allergens' && <AllergensTab />}
    </div>
  )
}
