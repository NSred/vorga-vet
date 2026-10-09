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

  it('shows the owner and a phone link beside the name', () => {
    render(<PatientDetailPanel patient={patient} open onOpenChange={vi.fn()} />)

    const phone = screen.getByRole('link', { name: 'Call Ana Petrović, 062/8890021' })

    expect(phone).toHaveAttribute('href', 'tel:0628890021')
    expect(phone.parentElement).toHaveTextContent('Ana Petrović062/8890021')
    expect(screen.getByText('Chartreux · —').nextElementSibling).toBe(phone.parentElement)
  })

  it('shows the age in years and months', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-09T12:00:00'))
    render(
      <PatientDetailPanel
        patient={{ ...patient, birthDate: '2023-08-01' }}
        open
        onOpenChange={vi.fn()}
      />,
    )
    vi.useRealTimers()

    expect(screen.getByText('Chartreux · 3 yrs 2 mo')).toBeInTheDocument()
    expect(screen.getByText('Age').nextElementSibling).toHaveTextContent(/^3 yrs 2 mo$/)
  })

  it.each([
    ['dog', '--species-dog-soft'],
    ['cat', '--species-cat-soft'],
    ['bird', '--species-bird-soft'],
    ['other', '--species-other-soft'],
  ] as const)('tints the header for a %s', (species, token) => {
    render(<PatientDetailPanel patient={{ ...patient, species }} open onOpenChange={vi.fn()} />)

    const header = screen.getByText('C26-1').closest('[style]')
    expect(header?.getAttribute('style')).toContain(`var(${token})`)
  })

  it('shows a swatch beside a listed coat colour', () => {
    render(
      <PatientDetailPanel patient={{ ...patient, color: 'golden' }} open onOpenChange={vi.fn()} />,
    )

    const value = screen.getByText('golden')
    expect(value.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })

  it('shows free text without a swatch', () => {
    render(
      <PatientDetailPanel patient={{ ...patient, color: 'Brindle' }} open onOpenChange={vi.fn()} />,
    )

    const value = screen.getByText('Brindle')
    expect(value.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument()
  })

  it('leads the basic information with weight and sex tiles', () => {
    render(<PatientDetailPanel patient={patient} open onOpenChange={vi.fn()} />)

    expect(screen.getByText('Weight').nextElementSibling).toHaveTextContent('4.2 kg')
    expect(screen.getByText('Sex').nextElementSibling).toHaveTextContent('Female')
    expect(screen.getByText('Age').nextElementSibling).toHaveTextContent('—')
  })
})
