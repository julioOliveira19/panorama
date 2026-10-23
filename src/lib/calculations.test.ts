import { describe, expect, it } from 'vitest'
import { debtSummary, growthSummary } from './calculations'
import type { DataPoint } from '../types'

const points: DataPoint[] = [
  { year: 2000, value: 10, source: 'FPP', status: 'observation' },
  { year: 2001, value: -5, source: 'FPP', status: 'observation' },
  { year: 2003, value: 20, source: 'FPP', status: 'observation' },
]

describe('growthSummary', () => {
  it('calcula média, composição e lacunas sem preencher anos ausentes', () => {
    const result = growthSummary(points, 2000, 2003)
    expect(result.average).toBeCloseTo(8.3333)
    expect(result.cumulative).toBeCloseTo(25.4)
    expect(result.validYears).toBe(3)
    expect(result.missingYears).toBe(1)
  })
})

describe('debtSummary', () => {
  it('calcula mudança em pontos percentuais entre observações disponíveis', () => {
    const result = debtSummary(points, 2000, 2003)
    expect(result.initial).toBe(10)
    expect(result.final).toBe(20)
    expect(result.change).toBe(10)
    expect(result.missingYears).toBe(1)
  })
})
