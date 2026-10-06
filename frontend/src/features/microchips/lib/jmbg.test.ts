import { describe, expect, it } from 'vitest'
import { jmbgError } from './jmbg'

describe('jmbgError', () => {
  it('accepts numbers whose control digit matches', () => {
    expect(jmbgError('0101990710008')).toBeUndefined()
    expect(jmbgError(' 1505877800014 ')).toBeUndefined()
    expect(jmbgError('3112998500129')).toBeUndefined()
  })

  it('catches a wrong control digit', () => {
    expect(jmbgError('0101990710009')).toBe('This JMBG has a typing mistake')
    expect(jmbgError('1505877800041')).toBe('This JMBG has a typing mistake')
  })

  it('asks for 13 digits', () => {
    expect(jmbgError('')).toBe('Type the owner’s JMBG')
    expect(jmbgError('010199071000')).toBe('A JMBG is 13 digits')
    expect(jmbgError('01019907100O8')).toBe('A JMBG is 13 digits')
  })
})
