import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'
import { emptyExaminationValues } from '../lib/examinationDetails'
import type { ExaminationFormValues } from '../types'
import { ExaminationFields } from './ExaminationFields'

function Harness({
  defaults,
  onSubmit,
}: {
  defaults: ExaminationFormValues
  onSubmit: (values: ExaminationFormValues) => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExaminationFormValues>({ defaultValues: defaults })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ExaminationFields register={register} errors={errors} />
      <button type="submit">Save</button>
    </form>
  )
}

describe('ExaminationFields', () => {
  it('requires the performer names', async () => {
    const onSubmit = vi.fn()
    render(<Harness defaults={emptyExaminationValues()} onSubmit={onSubmit} />)

    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('First name is required')).toBeInTheDocument()
    expect(screen.getByText('Last name is required')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows prefilled performer names and keeps them editable', async () => {
    const onSubmit = vi.fn()
    render(<Harness defaults={emptyExaminationValues('Mira', 'Vet')} onSubmit={onSubmit} />)

    const first = screen.getByLabelText('Performed by, first name *') as HTMLInputElement
    expect(first.value).toBe('Mira')

    await userEvent.clear(first)
    await userEvent.type(first, 'Jovana')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ performedByFirstName: 'Jovana', performedByLastName: 'Vet' }),
      expect.anything(),
    )
  })

  it('rejects a negative or non-numeric cost', async () => {
    const onSubmit = vi.fn()
    render(<Harness defaults={emptyExaminationValues('Mira', 'Vet')} onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Cost'), '-5')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Enter an amount of 0 or more')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
