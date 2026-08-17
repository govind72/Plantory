import { describe, it, expect } from 'vitest'
import { roundToNearest, roundUpToNearest } from './rounding'

describe('roundToNearest', () => {
  it('rounds to the nearest step', () => {
    expect(roundToNearest(452, 10)).toBe(450)
    expect(roundToNearest(455, 10)).toBe(460)
    expect(roundToNearest(391, 5)).toBe(390)
  })

  it('leaves exact multiples unchanged', () => {
    expect(roundToNearest(390, 10)).toBe(390)
  })

  it('throws on a non-positive step', () => {
    expect(() => roundToNearest(100, 0)).toThrow()
    expect(() => roundToNearest(100, -10)).toThrow()
  })
})

describe('roundUpToNearest', () => {
  it('always rounds up to the next multiple', () => {
    expect(roundUpToNearest(451, 10)).toBe(460)
    expect(roundUpToNearest(450, 10)).toBe(450)
  })
})
