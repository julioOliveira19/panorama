import { describe, expect, it } from 'vitest'
import { buildCsv } from './exportCsv'
import type { Country, PanoramaData } from '../types'

const japan: Country = {
  code: 'JPN',
  name: 'Japão',
  availability: {
    growth: { minYear: 2000, maxYear: 2000, count: 1 },
    debt: { minYear: 2000, maxYear: 2000, count: 1 },
  },
}

const series = {
  growth: {
    JPN: [{ year: 2000, value: 2.5, source: 'FPP', status: 'observation' }],
  },
  debt: {
    JPN: [{ year: 2000, value: 135.6, source: 'FPP', status: 'observation' }],
  },
} satisfies PanoramaData['series']

describe('buildCsv', () => {
  it('exporta os dois indicadores quando o modo ambos está selecionado', () => {
    const csv = buildCsv('both', [japan], series, 2000, 2000)

    expect(csv).toContain('JPN,Japão,2000,growth,2.5,%,FPP,observation')
    expect(csv).toContain('JPN,Japão,2000,debt,135.6,% do PIB,FPP,observation')
  })
})
