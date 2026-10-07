import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PatientDetailPanel } from './PatientDetailPanel'
import type { PatientDetail } from '../types'

const patient: PatientDetail = {
  id: 'p1',
  cardNumber: 'C26-1',
  name: 'Luna',
  species: 'cat',
  breedName: 'Chartreux',
  sex: 'female',
  weightKg: 4.2,
  isDeleted: false,
  ownerId: 'o1',
  breedId: 'b1',
  ownerName: 'Ana Petrović',
  phoneNumber: '062/8890021',
  city: 'Novi Sad',
  createdAt: '2026-08-27',
  allergies: [{ id: 'al1', name: 'Penicillin' }],
}

describe('PatientDetailPanel', () => {
  it('shows the card number, status, sex and allergies in the header', () => {
    render(<PatientDetailPanel patient={patient} open onOpenChange={vi.fn()} />)

    expect(screen.getByText('C26-1')).toBeInTheDocument()
    expect(screen.getByText('● Active')).toBeInTheDocument()
    expect(screen.getByText('♀ Female')).toBeInTheDocument()
    expect(screen.getByText('⚠ Penicillin')).toBeInTheDocument()
  })

  it('leads the basic information with weight and sex tiles', () => {
    render(<PatientDetailPanel patient={patient} open onOpenChange={vi.fn()} />)

    expect(screen.getByText('Weight').nextElementSibling).toHaveTextContent('4.2 kg')
    expect(screen.getByText('Sex').nextElementSibling).toHaveTextContent('Female')
    expect(screen.getByText('Age').nextElementSibling).toHaveTextContent('—')
  })
})
