const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function isDateOnly(value: string | null | undefined): value is string {
  return typeof value === 'string' && DATE_ONLY_PATTERN.test(value)
}

export function hasAtMostTwoDecimals(value: number): boolean {
  const cents = value * 100
  return Math.abs(cents - Math.round(cents)) < 1e-6
}

export function trimmedOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function trimmedLength(value: string | null | undefined): number {
  return value?.trim().length ?? 0
}

export function sameText(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase()
}

export function requiredTextMessages(
  fields: readonly (readonly [value: string | undefined, label: string])[],
  maxLength: number,
): string[] {
  return fields.flatMap(([value, label]) => {
    const length = trimmedLength(value)
    if (length === 0) return [`${label} is required.`]
    return length > maxLength ? [`${label} is too long.`] : []
  })
}
