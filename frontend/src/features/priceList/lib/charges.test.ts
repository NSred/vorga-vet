import { describe, expect, it } from 'vitest'
import {
  chargesError,
  chargesText,
  chargesTotal,
  draftErrors,
  draftFromItem,
  EARLIER_COST_NAME,
  extraDraft,
  fromDraft,
  initialDrafts,
  parseQuantity,
} from './charges'

const synulox = {
  id: 'm9',
  kind: 'medication' as const,
  name: 'Synulox',
  price: 150.5,
  unit: 'tbl.',
  isActive: true,
}

describe('charges', () => {
  it('copies an item with quantity 1 and its price as input text', () => {
    expect(draftFromItem(synulox, '2026-10-05')).toMatchObject({
      kind: 'medication',
      itemId: 'm9',
      name: 'Synulox',
      unitPrice: '150,5',
      quantity: '1',
      dose: '',
    })
  })

  it('totals valid lines only, rounded to cents', () => {
    const two = { ...draftFromItem(synulox, '2026-10-05'), quantity: '2' }
    const half = { ...extraDraft('Night visit', 1000), quantity: '0,5' }
    const broken = { ...extraDraft('Broken', 10), unitPrice: 'abc' }

    expect(chargesTotal([two, half, broken])).toBe(801)
  })

  it('parses quantities above 0 with up to two decimals', () => {
    expect(parseQuantity('2')).toBe(2)
    expect(parseQuantity('0,25')).toBe(0.25)
    expect(parseQuantity('0')).toBeUndefined()
    expect(parseQuantity('1,234')).toBeUndefined()
    expect(parseQuantity('10000')).toBeUndefined()
  })

  it('explains what is wrong with a line', () => {
    expect(draftErrors({ ...extraDraft(), quantity: '0' })).toEqual({
      name: 'Describe the cost',
      unitPrice: 'Price is required',
      quantity: 'Enter a quantity above 0',
    })
    expect(draftErrors({ ...draftFromItem(synulox, '2026-10-05'), dose: 'x'.repeat(101) })).toEqual(
      {
        dose: 'Maximum 100 characters',
      },
    )
  })

  it('refuses a total above the numeric(10,2) limit', () => {
    const huge = { ...extraDraft('Huge', 99_999_999), quantity: '2' }
    expect(chargesError([huge])).toBe('The total is too large')
    expect(chargesError([extraDraft('Fine', 100)])).toBeUndefined()
  })

  it('turns a draft into a line and keeps the dose for medications only', () => {
    const draft = {
      ...draftFromItem(synulox, '2026-10-05'),
      quantity: '2',
      dose: ' 1 tbl. x 5 dana ',
    }
    expect(fromDraft(draft, 'e1-1')).toEqual({
      id: 'e1-1',
      kind: 'medication',
      itemId: 'm9',
      name: 'Synulox',
      unitPrice: 150.5,
      quantity: 2,
      dose: '1 tbl. x 5 dana',
    })
    expect(
      fromDraft({ ...extraDraft('Night visit', 1000), dose: 'x' }, 'e1-2').dose,
    ).toBeUndefined()
  })

  it('starts from saved lines, or from an earlier hand-typed cost, or empty', () => {
    const saved = [
      {
        id: 'l1',
        kind: 'service' as const,
        itemId: 's1',
        name: 'Obrada rane',
        unitPrice: 1200,
        quantity: 1,
      },
    ]
    expect(initialDrafts(saved, 999)).toHaveLength(1)
    expect(initialDrafts(saved, 999)[0]).toMatchObject({ name: 'Obrada rane', unitPrice: '1200' })

    expect(initialDrafts([], 45.5)).toEqual([
      expect.objectContaining({
        kind: 'extra',
        name: EARLIER_COST_NAME,
        unitPrice: '45,5',
        quantity: '1',
      }),
    ])
    expect(initialDrafts([], 0)).toEqual([])
    expect(initialDrafts([])).toEqual([])
  })

  it('gives a vaccine line a batch and a due date from the vaccine duration', () => {
    const rabies = {
      id: 'm1',
      kind: 'medication' as const,
      name: 'Nobivac Rabies',
      price: 900,
      unit: 'kom',
      vaccine: { isRabies: true, validityDays: 365 },
      isActive: true,
    }
    const draft = draftFromItem(rabies, '2026-10-05')
    expect(draft.vaccine).toEqual({
      isRabies: true,
      validityDays: 365,
      batch: '',
      dueOn: '2027-10-05',
    })
    expect(draftFromItem(synulox, '2026-10-05').vaccine).toBeUndefined()

    expect(
      draftErrors({ ...draft, vaccine: { ...draft.vaccine!, dueOn: '', batch: 'x'.repeat(51) } }),
    ).toEqual({
      batch: 'Batch: maximum 50 characters',
      dueOn: 'Pick the next due date',
    })
    expect(
      fromDraft({ ...draft, vaccine: { ...draft.vaccine!, batch: ' A3KZ ' } }, 'e1-1').vaccine,
    ).toEqual({
      isRabies: true,
      batch: 'A3KZ',
      dueOn: '2027-10-05',
    })
  })

  it('lists the lines as text with any quantity other than one', () => {
    expect(
      chargesText([
        { id: 'e1-1', kind: 'service', name: 'Pregled', unitPrice: 1500, quantity: 1 },
        { id: 'e1-2', kind: 'medication', name: 'Synulox', unitPrice: 150.5, quantity: 2.5 },
      ]),
    ).toBe('Pregled, Synulox ×2,5')
  })
})
