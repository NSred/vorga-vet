import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'
import { emptyExaminationValues } from '../lib/examinationDetails'
import type { DiagnosisFieldProps, ExaminationFormValues } from '../types'
import { ExaminationFields } from './ExaminationFields'

function fakeDiagnosis({ value, onChange, error }: DiagnosisFieldProps) {
  return (
    <>
      <input
        aria-label="Diagnosis"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && <p>{error}</p>}
    </>
  )
}

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
    control,
    formState: { errors },
  } = useForm<ExaminationFormValues>({ defaultValues: defaults })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ExaminationFields
        register={register}
        control={control}
        errors={errors}
        renderDiagnosis={fakeDiagnosis}
        costSection={<p>charges go here</p>}
      />
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

  it('renders the cost section in place of a cost field', () => {
    render(<Harness defaults={emptyExaminationValues('Mira', 'Vet')} onSubmit={vi.fn()} />)

    expect(screen.getByText('charges go here')).toBeInTheDocument()
    expect(screen.queryByLabelText('Cost')).not.toBeInTheDocument()
  })
})
