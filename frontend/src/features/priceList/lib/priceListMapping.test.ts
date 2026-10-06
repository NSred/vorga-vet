import { describe, expect, it } from 'vitest'
import {
  emptyFormValues,
  formValuesOf,
  statusToApi,
  toPriceListItem,
  toWriteRequest,
} from './priceListMapping'

describe('price list mapping', () => {
  it('maps the status to the backend numbers', () => {
    expect(statusToApi('active')).toBe(0)
    expect(statusToApi('all')).toBe(1)
    expect(statusToApi('retired')).toBe(2)
  })

  it('maps a DTO and drops an empty unit', () => {
    expect(
      toPriceListItem('medication', {
        id: 'm1',
        name: 'Synulox',
        price: 150,
        unit: null,
        isActive: true,
        createdAt: '2026-10-05T08:00:00Z',
      }),
    ).toEqual({ id: 'm1', kind: 'medication', name: 'Synulox', price: 150, isActive: true })
  })

  it('round-trips an item through the form with a comma decimal', () => {
    const values = formValuesOf({
      id: 'm1',
      kind: 'medication',
      name: 'Dexa 0,2',
      price: 80.5,
      unit: 'ml',
      isActive: true,
    })

    expect(values).toEqual({
      name: 'Dexa 0,2',
      price: '80,5',
      unit: 'ml',
      isVaccine: false,
      isRabies: false,
      validityDays: '365',
    })
    expect(toWriteRequest('medication', values)).toEqual({
      name: 'Dexa 0,2',
      price: 80.5,
      unit: 'ml',
      isVaccine: false,
      isRabies: false,
      validityDays: null,
    })
  })

  it('carries the vaccine marks both ways', () => {
    const values = formValuesOf({
      id: 'm2',
      kind: 'medication',
      name: 'Nobivac Rabies',
      price: 900,
      unit: 'kom',
      vaccine: { isRabies: true, validityDays: 730 },
      isActive: true,
    })

    expect(values).toMatchObject({ isVaccine: true, isRabies: true, validityDays: '730' })
    expect(toWriteRequest('medication', values)).toMatchObject({
      isVaccine: true,
      isRabies: true,
      validityDays: 730,
    })
    expect(toWriteRequest('medication', { ...values, isVaccine: false })).toMatchObject({
      isVaccine: false,
      isRabies: false,
      validityDays: null,
    })
  })

  it('sends no unit or marks for a service and a null unit for an empty medication unit', () => {
    const empty = emptyFormValues()
    expect(
      toWriteRequest('service', { ...empty, name: ' Obrada rane ', price: '1200', unit: 'kom' }),
    ).toEqual({
      name: 'Obrada rane',
      price: 1200,
    })
    expect(
      toWriteRequest('medication', { ...empty, name: 'X', price: '1', unit: '  ' }),
    ).toMatchObject({
      name: 'X',
      price: 1,
      unit: null,
    })
  })
})
