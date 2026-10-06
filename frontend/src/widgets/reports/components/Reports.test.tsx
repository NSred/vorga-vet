import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as examinationsApi from '@/features/examinations/api/examinationsApi'
import type { Examination } from '@/features/examinations'
import * as patientsApi from '@/features/patients/api/patientsApi'
import { resetChargesStore, saveCharges } from '@/features/priceList/api/mockChargesStore'
import { ApiError } from '@/shared/lib/apiClient'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { reportExamination, reportPatient } from '@/test/reportFixtures'
import { DailyReport } from './DailyReport'
import { DeletedCards } from './DeletedCards'
import { UnpaidExams } from './UnpaidExams'

const luna = reportPatient()
const rex = reportPatient({
  id: 'p2',
  cardNumber: 'C25-9',
  name: 'Rex',
  species: 'dog',
  breedName: 'Beagle',
  isDeleted: true,
  ownerName: 'Ivan Ilić',
  phoneNumber: '063 987 654',
})

let examinations: Examination[]
let printed: string | undefined

function serviceLine(id: string, name: string, quantity = 1) {
  return { id, kind: 'service' as const, name, unitPrice: 500, quantity }
}

beforeEach(() => {
  examinations = [
    reportExamination({ id: 'e1', startedAt: '2026-10-05T08:00:00Z', cost: 2500 }),
    reportExamination({
      id: 'e2',
      patientId: 'p2',
      startedAt: '2026-10-04T22:30:00Z',
      diagnosis: 'Vakcinacija',
      performedByFirstName: 'Jelena',
      performedByLastName: 'Kostić',
      cost: 1200,
      isPaid: true,
    }),
    reportExamination({ id: 'e3', startedAt: '2026-10-01T09:00:00Z', cost: 800 }),
  ]

  resetChargesStore()
  saveCharges('e1', [serviceLine('l1', 'Pregled'), serviceLine('l2', 'Kapi za uši', 2)])

  vi.spyOn(patientsApi, 'getPatients').mockImplementation(async (filters, page, pageSize) => {
    const items = filters.status === 'deleted' ? [rex] : [luna, rex]
    return { items, totalCount: items.length, page, pageSize }
  })
  vi.spyOn(examinationsApi, 'getPatientExaminations').mockImplementation(async (patientId) =>
    examinations.filter((examination) => examination.patientId === patientId),
  )

  printed = undefined
  vi.spyOn(window, 'print').mockImplementation(() => {
    printed = document.querySelector('.print-root')?.textContent ?? undefined
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

const noPrint = { printing: false, onPrinted: () => undefined }

function rowOf(text: string) {
  return screen.getByText(text, { selector: 'span' }).closest('tr') as HTMLElement
}

function firstCells() {
  return screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0].textContent ?? '')
}

describe('DailyReport', () => {
  it("lists the day's exams by clinic time, with charges, and adds them up", async () => {
    render(
      <DailyReport day="2026-10-05" onDayChange={vi.fn()} onOpenPatient={vi.fn()} {...noPrint} />,
    )

    expect(await screen.findByText('Rex', { selector: 'span' })).toBeInTheDocument()
    expect(firstCells()).toEqual(['00:30', '10:00'])
    expect(within(rowOf('Rex')).getByText('Jelena Kostić')).toBeInTheDocument()
    expect(within(rowOf('Rex')).getByText('· Ivan Ilić')).toBeInTheDocument()
    expect(within(rowOf('Rex')).getByText('C25-9')).toBeInTheDocument()
    expect(within(rowOf('Rex')).getByText('Paid')).toBeInTheDocument()
    expect(await within(rowOf('Luna')).findByText('Pregled, Kapi za uši ×2')).toBeInTheDocument()

    const summary = screen.getByLabelText('Day totals')
    expect(summary).toHaveTextContent('Exams2')
    expect(summary).toHaveTextContent('Total3.700,00 RSD')
    expect(summary).toHaveTextContent('Paid1.200,00 RSD')
    expect(summary).toHaveTextContent('Unpaid2.500,00 RSD')
  })

  it('says so on a day without exams and offers Today', async () => {
    const user = userEvent.setup()
    const onDayChange = vi.fn()
    render(
      <DailyReport
        day="2020-01-03"
        onDayChange={onDayChange}
        onOpenPatient={vi.fn()}
        {...noPrint}
      />,
    )

    expect(await screen.findByText('No exams on 03.01.2020.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Day' })).toHaveTextContent('Friday 03.01.2020')
    await user.click(screen.getByRole('button', { name: 'Today' }))
    expect(onDayChange).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/))
  })

  it('moves a day at a time and opens the patient from a row', async () => {
    const user = userEvent.setup()
    const onDayChange = vi.fn()
    const onOpenPatient = vi.fn()
    render(
      <DailyReport
        day="2026-10-05"
        onDayChange={onDayChange}
        onOpenPatient={onOpenPatient}
        {...noPrint}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Previous day' }))
    await user.click(screen.getByRole('button', { name: 'Next day' }))
    expect(onDayChange.mock.calls).toEqual([['2026-10-04'], ['2026-10-06']])

    await user.click(await screen.findByText('Luna', { selector: 'span' }))
    expect(onOpenPatient).toHaveBeenCalledWith('p1')
  })

  it('prints the day in Serbian', async () => {
    const onPrinted = vi.fn()
    const { rerender } = render(
      <DailyReport day="2026-10-05" onDayChange={vi.fn()} onOpenPatient={vi.fn()} {...noPrint} />,
    )

    await screen.findByText('Pregled, Kapi za uši ×2')
    rerender(
      <DailyReport
        day="2026-10-05"
        onDayChange={vi.fn()}
        onOpenPatient={vi.fn()}
        printing
        onPrinted={onPrinted}
      />,
    )

    await waitFor(() => expect(window.print).toHaveBeenCalledTimes(1))
    expect(onPrinted).toHaveBeenCalled()
    expect(printed).toContain('Dnevni izveštaj za 05.10.2026.')
    expect(printed).toContain('Usluge i lekovi')
    expect(printed).toContain('Pregled, Kapi za uši ×2')
    expect(printed).toContain('Ukupno3.700,00 RSD')
    expect(printed).toContain('Neplaćeno2.500,00 RSD')
    expect(printed).toContain('Odštampano')
  })
})

describe('UnpaidExams', () => {
  it('lists unpaid exams oldest first with the owner phone and the total owed', async () => {
    render(<UnpaidExams onOpenPatient={vi.fn()} {...noPrint} />)

    expect(await screen.findByText('01.10.2026')).toBeInTheDocument()
    expect(firstCells().map((cell) => cell.slice(0, 10))).toEqual(['01.10.2026', '05.10.2026'])
    expect(screen.queryByText('Rex')).not.toBeInTheDocument()
    expect(within(rowOf('01.10.2026')).getByRole('link', { name: '062 123 456' })).toHaveAttribute(
      'href',
      'tel:062123456',
    )
    const summary = screen.getByLabelText('Unpaid totals')
    expect(summary).toHaveTextContent('Outstanding3.300,00 RSD')
    expect(summary).toHaveTextContent('2 exams · 1 owner · oldest first')
  })

  it('marks an exam paid, which removes it and lowers the total', async () => {
    const user = userEvent.setup()
    const onOpenPatient = vi.fn()
    const pay = vi.spyOn(examinationsApi, 'payExamination').mockImplementation(async (id) => {
      examinations = examinations.map((examination) =>
        examination.id === id ? { ...examination, isPaid: true } : examination,
      )
    })
    render(<UnpaidExams onOpenPatient={onOpenPatient} {...noPrint} />)

    await user.click(
      await screen.findByRole('button', { name: "Mark Luna's exam of 01.10.2026 as paid" }),
    )

    expect(pay).toHaveBeenCalledWith('e3')
    expect(onOpenPatient).not.toHaveBeenCalled()
    expect(await screen.findByText("Luna's exam marked as paid")).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByLabelText('Unpaid totals')).toHaveTextContent('Outstanding2.500,00 RSD'),
    )
    expect(screen.queryByText('01.10.2026')).not.toBeInTheDocument()
  })

  it('refreshes when someone else already settled it', async () => {
    const user = userEvent.setup()
    vi.spyOn(examinationsApi, 'payExamination').mockImplementation(async (id) => {
      examinations = examinations.map((examination) =>
        examination.id === id ? { ...examination, isPaid: true } : examination,
      )
      throw new ApiError(409, 'Conflict', 'Examinations.AlreadyPaid')
    })
    render(<UnpaidExams onOpenPatient={vi.fn()} {...noPrint} />)

    await user.click(
      await screen.findByRole('button', { name: "Mark Luna's exam of 01.10.2026 as paid" }),
    )

    expect(
      await screen.findByText('This examination is already marked as paid.'),
    ).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('01.10.2026')).not.toBeInTheDocument())
  })

  it('prints the list of debtors', async () => {
    render(<UnpaidExams onOpenPatient={vi.fn()} printing onPrinted={vi.fn()} />)

    await waitFor(() => expect(window.print).toHaveBeenCalledTimes(1))
    expect(printed).toContain('Lista dužnika')
    expect(printed).toContain('062 123 456')
    expect(printed).toContain('Ukupno dugovanje3.300,00 RSD')
  })
})

describe('DeletedCards', () => {
  it('lists only the deleted cards', async () => {
    render(<DeletedCards {...noPrint} />)

    expect(await screen.findByText('Rex')).toBeInTheDocument()
    expect(screen.queryByText('Luna')).not.toBeInTheDocument()
    expect(screen.getByText('Dog')).toBeInTheDocument()
    expect(screen.getByText('Beagle')).toBeInTheDocument()
    expect(screen.getByLabelText('Deleted totals')).toHaveTextContent('Deleted cards1')
  })

  it('prints them in Serbian', async () => {
    render(<DeletedCards printing onPrinted={vi.fn()} />)

    await waitFor(() => expect(window.print).toHaveBeenCalledTimes(1))
    expect(printed).toContain('Lista brisanih kartona')
    expect(printed).toContain('Pas')
    expect(printed).toContain('C25-9')
  })
})
