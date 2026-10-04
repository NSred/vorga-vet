import { describe, expect, it } from 'vitest'
import { appointmentKeys } from './appointmentKeys'

const range = { from: '2026-09-16T22:00:00.000Z', to: '2026-09-17T22:00:00.000Z' }

describe('appointmentKeys.availability', () => {
  it('shares the key between the default and an explicit 30-minute request', () => {
    expect(appointmentKeys.availability(range)).toEqual(appointmentKeys.availability(range, 30))
  })

  it('separates other durations', () => {
    expect(appointmentKeys.availability(range, 90)).not.toEqual(appointmentKeys.availability(range))
  })

  it('stays under the feature root', () => {
    expect(appointmentKeys.availability(range).slice(0, 1)).toEqual(appointmentKeys.all)
    expect(appointmentKeys.list(range).slice(0, 1)).toEqual(appointmentKeys.all)
  })
})

describe('appointmentKeys detail and unresolved', () => {
  it('stay under the feature root', () => {
    expect(appointmentKeys.detail('a1')).toEqual(['appointments', 'detail', 'a1'])
    expect(appointmentKeys.unresolved()).toEqual(['appointments', 'unresolved'])
  })
})
