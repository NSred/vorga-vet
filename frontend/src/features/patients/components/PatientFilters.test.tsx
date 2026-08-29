import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { PatientFilters } from './PatientFilters'
import * as allergensApi from '../api/allergensApi'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PatientFilters', () => {
  it('commits the search term once, not once per keystroke', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    vi.spyOn(allergensApi, 'searchAllergens').mockResolvedValue([])

    render(<PatientFilters filters={{ status: 'active' }} onChange={onChange} />)

    await user.type(screen.getByRole('searchbox'), 'Rex')

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ search: 'Rex' }))
    })
    expect(onChange).toHaveBeenCalledTimes(1)
  })
})
