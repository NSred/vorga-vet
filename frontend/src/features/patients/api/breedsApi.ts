import { apiFetch } from '@/shared/lib/apiClient'
import { speciesToApi } from '../lib/enumMapping'
import type { BreedOption, CreateBreedRequest, Species } from '../types'

export function searchBreeds(species: Species, search: string): Promise<BreedOption[]> {
  const params = new URLSearchParams({ species: String(speciesToApi(species)) })
  const term = search.trim()
  if (term) {
    params.set('search', term)
  }

  return apiFetch<BreedOption[]>(`/breeds?${params.toString()}`)
}

export function createBreed(request: CreateBreedRequest): Promise<string> {
  return apiFetch<string>('/breeds', {
    method: 'POST',
    body: JSON.stringify({ name: request.name, species: speciesToApi(request.species) }),
  })
}
