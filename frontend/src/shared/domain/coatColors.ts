export interface CoatColor {
  name: string
  swatch: string
}

export const COAT_COLORS: readonly CoatColor[] = [
  { name: 'Black', swatch: '#1f1d1b' },
  { name: 'White', swatch: '#fbfaf7' },
  { name: 'Grey', swatch: '#8c8a86' },
  { name: 'Silver', swatch: 'linear-gradient(135deg, #eceef0, #a7abb0)' },
  { name: 'Brown', swatch: '#6b4226' },
  { name: 'Ginger', swatch: '#c96a26' },
  { name: 'Cream', swatch: '#efe0bf' },
  { name: 'Golden', swatch: '#d4a43c' },
  { name: 'Fawn', swatch: '#c9a27a' },
  { name: 'Black and white', swatch: 'linear-gradient(135deg, #1f1d1b 50%, #fbfaf7 50%)' },
  {
    name: 'Tricolor',
    swatch: 'conic-gradient(#1f1d1b 0 120deg, #c96a26 120deg 240deg, #fbfaf7 240deg)',
  },
  {
    name: 'Tabby',
    swatch: 'repeating-linear-gradient(45deg, #7a5a3a 0 3px, #c9a27a 3px 6px)',
  },
]

export function coatColorOf(name?: string): CoatColor | undefined {
  const wanted = name?.trim().toLocaleLowerCase()
  if (!wanted) return undefined
  return COAT_COLORS.find((color) => color.name.toLocaleLowerCase() === wanted)
}
