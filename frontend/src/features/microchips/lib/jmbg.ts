const WEIGHTS = [7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2]

export function jmbgError(text: string): string | undefined {
  const value = text.trim()
  if (!value) return 'Type the owner’s JMBG'
  if (!/^\d{13}$/.test(value)) return 'A JMBG is 13 digits'

  const digits = [...value].map(Number)
  const sum = WEIGHTS.reduce((total, weight, index) => total + weight * digits[index], 0)
  const remainder = 11 - (sum % 11)
  const control = remainder > 9 ? 0 : remainder

  return control === digits[12] ? undefined : 'This JMBG has a typing mistake'
}
