export type Species = 'dog' | 'cat' | 'bird' | 'other'

export const SPECIES_EMOJI: Record<Species, string> = {
  dog: '🐶',
  cat: '🐱',
  bird: '🐦',
  other: '🐾',
}

export const SPECIES_LABELS: Record<Species, string> = {
  dog: 'Dog',
  cat: 'Cat',
  bird: 'Bird',
  other: 'Other',
}

export const SPECIES_TINT: Record<Species, string> = {
  dog: 'var(--species-dog-soft)',
  cat: 'var(--species-cat-soft)',
  bird: 'var(--species-bird-soft)',
  other: 'var(--species-other-soft)',
}

export const SPECIES_OPTIONS = (Object.keys(SPECIES_LABELS) as Species[]).map((value) => ({
  value,
  label: SPECIES_LABELS[value],
}))
