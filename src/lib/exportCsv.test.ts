import { describe, expect, it } from 'vitest'
import { buildCsv } from './exportCsv'
import type { Country, PanoramaData } from '../types'

const japan: Country = {
  code: 'JPN',
  name: 'Japão',
  availability: {
    growth: { minYear: 2000, maxYear: 2000, count: 1 },
    debt: { minYear: 2000, maxYear: 2000, count: 1 },
    gdpPerCapita: { minYear: 2000, maxYear: 2000, count: 1 },
    consumptionPerCapita: { minYear: 2000, maxYear: 2000, count: 1 },
  },
}

const series = {
  growth: {
    JPN: [{ year: 2000, value: 2.5, source: 'FPP', status: 'observation' }],
  },
  debt: {
    JPN: [{ year: 2000, value: 135.6, source: 'FPP', status: 'observation' }],
  },
  gdpPerCapita: {
    JPN: [{ year: 2000, value: 32_000, source: 'WB', status: 'published' }],
  },
  consumptionPerCapita: {
    JPN: [{ year: 2000, value: 21_000, source: 'WB', status: 'published' }],
  },
} satisfies PanoramaData['series']

describe('buildCsv', () => {
  it('exporta os dois indicadores quando o modo ambos está selecionado', () => {
    const csv = buildCsv('both', [japan], series, 2000, 2000)

    expect(csv).toContain('JPN,Japão,2000,crescimento_pib_real,2.5,%,FPP,observação')
    expect(csv).toContain('JPN,Japão,2000,divida_publica,135.6,% do PIB,FPP,observação')
  })

  it('traduz cabeçalhos e valores controlados para inglês', () => {
    const csv = buildCsv('growth', [{ ...japan, name: 'Japan' }], series, 2000, 2000, 'en')

    expect(csv.split('\n')[0]).toBe('country_code,country,year,indicator,value,unit,source,status')
    expect(csv).toContain('JPN,Japan,2000,real_gdp_growth,2.5,%,FPP,observation')
  })

  it('exporta os indicadores per capita com unidade PPC constante', () => {
    const csv = buildCsv('gdpPerCapita', [japan], series, 2000, 2000)

    expect(csv).toContain('JPN,Japão,2000,pib_per_capita_ppc_constante,32000,int$ 2021 por habitante,WB,dado publicado')
  })
})
