import { describe, it, expect } from 'vitest'
import { contrastRatio, LOCKED_COLORS } from './derive'

describe('locked colors from tokens.css', () => {
  it('exposes eight locked colors', () => {
    expect(Object.keys(LOCKED_COLORS).length).toBe(8)
  })
})

describe('contrast ratio', () => {
  it('computes WCAG ratio', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1)
  })
})
