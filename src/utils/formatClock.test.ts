import { describe, it, expect } from 'vitest'
import { formatClock } from './formatClock'

describe('formatClock', () => {
  it('zero-pads minutes and seconds', () => {
    expect(formatClock(0)).toBe('00:00')
    expect(formatClock(3_000)).toBe('00:03')
    expect(formatClock(152_000)).toBe('02:32')
  })

  it('floors to whole seconds — a second shows only once it is over', () => {
    expect(formatClock(999)).toBe('00:00')
    expect(formatClock(13_999)).toBe('00:13')
  })

  it('runs minutes on past 59 instead of wrapping', () => {
    expect(formatClock(61 * 60_000)).toBe('61:00')
  })

  it('clamps negative or invalid input to zero', () => {
    expect(formatClock(-5_000)).toBe('00:00')
    expect(formatClock(Number.NaN)).toBe('00:00')
  })
})
