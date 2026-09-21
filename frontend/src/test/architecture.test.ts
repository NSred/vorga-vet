import { describe, expect, it } from 'vitest'

const LAYERS = ['shared', 'features', 'widgets', 'pages', 'app'] as const
type Layer = (typeof LAYERS)[number]

const SPECIFIER = /(?:import|export)[^'"]*?from\s+['"]([^'"]+)['"]/g

const sources = import.meta.glob('/src/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function isProductionFile(file: string): boolean {
  return !/\.test\.tsx?$/.test(file) && !file.startsWith('test/')
}

function layerOf(file: string): Layer | null {
  const head = file.split('/')[0]
  return (LAYERS as readonly string[]).includes(head) ? (head as Layer) : null
}

function featureOf(file: string): string | null {
  const parts = file.split('/')
  return parts[0] === 'features' ? parts[1] : null
}

function normalize(segments: string[]): string {
  const stack: string[] = []
  for (const segment of segments) {
    if (segment === '' || segment === '.') continue
    if (segment === '..') stack.pop()
    else stack.push(segment)
  }
  return stack.join('/')
}

function resolveSpecifier(fromFile: string, specifier: string): string | null {
  if (specifier.startsWith('@/')) return specifier.slice(2)
  if (!specifier.startsWith('.')) return null

  const directory = fromFile.split('/').slice(0, -1)
  return normalize([...directory, ...specifier.split('/')])
}

export function architectureViolations(): string[] {
  const found: string[] = []

  for (const [key, source] of Object.entries(sources)) {
    const from = key.replace(/^\/src\//, '')
    if (!isProductionFile(from)) continue

    const fromLayer = layerOf(from)
    if (!fromLayer) continue

    for (const match of source.matchAll(SPECIFIER)) {
      const to = resolveSpecifier(from, match[1])
      if (!to) continue

      const toLayer = layerOf(to)
      if (!toLayer) continue

      if (LAYERS.indexOf(toLayer) > LAYERS.indexOf(fromLayer)) {
        found.push(`${from} -> ${to} (upward import)`)
      }

      const a = featureOf(from)
      const b = featureOf(to)
      if (a && b && a !== b) {
        found.push(`${from} -> ${to} (cross-feature import)`)
      }
    }
  }

  return found
}

describe('frontend architecture', () => {
  it('scans the production sources', () => {
    expect(Object.keys(sources).filter((key) => key.includes('/features/'))).not.toHaveLength(0)
  })

  it('imports only downward and never across features', () => {
    expect(architectureViolations()).toEqual([])
  })
})
