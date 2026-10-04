import { apiFetch } from '@/shared/lib/apiClient'
import type { CreateOwnerRequest, OwnerOption } from '../types'

export function searchOwners(search: string): Promise<OwnerOption[]> {
  const term = search.trim()
  const query = term ? `?search=${encodeURIComponent(term)}` : ''

  return apiFetch<OwnerOption[]>(`/owners${query}`)
}

export function createOwner(request: CreateOwnerRequest): Promise<string> {
  return apiFetch<string>('/owners', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function ownerLabel(owner: OwnerOption): string {
  return `${owner.lastName} ${owner.firstName}`.trim()
}
