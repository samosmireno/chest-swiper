import { describe, it, expect } from 'vitest'
import { caseIdFromParam } from './url'

describe('caseIdFromParam', () => {
  it('maps ?case=1 to case1', () => {
    expect(caseIdFromParam('?case=1')).toBe('case1')
  })

  it('maps ?case=2 to case2', () => {
    expect(caseIdFromParam('?case=2')).toBe('case2')
  })

  it('tolerates ?case=case2', () => {
    expect(caseIdFromParam('?case=case2')).toBe('case2')
  })

  it('returns null when absent', () => {
    expect(caseIdFromParam('')).toBeNull()
    expect(caseIdFromParam('?foo=bar')).toBeNull()
  })

  it('returns null for a non-numeric value', () => {
    expect(caseIdFromParam('?case=abc')).toBeNull()
  })
})
