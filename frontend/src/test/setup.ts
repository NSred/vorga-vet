import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, vi } from 'vitest'

configure({ asyncUtilTimeout: 3000 })

beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.releasePointerCapture = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  cleanup()
})
