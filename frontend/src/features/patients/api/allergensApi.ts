import { apiFetch } from '@/shared/lib/apiClient'
import type { AllergenOption, CreateAllergenRequest } from '../types'

export function searchAllergens(search: string): Promise<AllergenOption[]> {
  const term = search.trim()
  const query = term ? `?search=${encodeURIComponent(term)}` : ''

  return apiFetch<AllergenOption[]>(`/allergens${query}`)
}

export function createAllergen(request: CreateAllergenRequest): Promise<string> {
  return apiFetch<string>('/allergens', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}
