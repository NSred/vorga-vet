import { useSearchParams } from 'react-router'
import { oneOf } from '@/shared/lib/listParams'
import { layout, PageHeader, SegmentedControl } from '@/shared/ui'
import { DiagnosesTab } from '@/features/diagnoses'
import { AllergensTab, BreedsTab } from '@/features/patients'
import { ExchangeRateTab } from '@/features/priceList'

type ListTab = 'diagnoses' | 'breeds' | 'allergens' | 'rate'

const TAB_OPTIONS = [
  { value: 'diagnoses', label: 'Diagnoses' },
  { value: 'breeds', label: 'Breeds' },
  { value: 'allergens', label: 'Allergens' },
  { value: 'rate', label: 'Euro rate' },
] as const

const SUBTITLES: Record<ListTab, string> = {
  diagnoses: 'The diagnoses the exam form offers. Typed diagnoses can be added from the exam too.',
  breeds: 'The breeds the patient form offers, per species.',
  allergens: 'The allergens the patient form offers.',
  rate: 'How many dinars a euro is worth, for the euro prices in the price list.',
}

const TABS: ListTab[] = ['diagnoses', 'breeds', 'allergens', 'rate']

export function ListsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = oneOf(searchParams.get('tab'), TABS) ?? 'diagnoses'

  return (
    <div className={layout.page}>
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
      {tab === 'rate' && <ExchangeRateTab />}
    </div>
  )
}
