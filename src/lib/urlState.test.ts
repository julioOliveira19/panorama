import { describe, expect, it } from 'vitest'
import { comparisonSearch, comparisonUrl, parseComparisonUrl } from './urlState'

describe('estado compartilhável na URL', () => {
  it('lê países, indicador, período e idioma válidos', () => {
    expect(parseComparisonUrl('?countries=bra,JPN,BRA&indicator=both&from=2025&to=2000&lang=en')).toEqual({
      countries: ['BRA', 'JPN'],
      mode: 'both',
      startYear: 2000,
      endYear: 2025,
      language: 'en',
    })
  })

  it('ignora valores inválidos e limita a seleção a cinco entidades', () => {
    const state = parseComparisonUrl('?countries=BRA,USA,CHN,JPN,PER,CAN&indicator=x&from=abc&to=4000')
    expect(state).toEqual({ countries: ['BRA', 'USA', 'CHN', 'JPN', 'PER'] })
  })

  it('serializa uma comparação reproduzível', () => {
    const state = {
      countries: ['BRA', 'PER'],
      mode: 'growth' as const,
      startYear: 2000,
      endYear: 2024,
      language: 'pt-BR' as const,
    }
    expect(comparisonSearch(state)).toBe('?countries=BRA%2CPER&indicator=growth&from=2000&to=2024&lang=pt-BR')
    expect(comparisonUrl(state, { origin: 'https://example.com', pathname: '/panorama/' } as Location))
      .toBe('https://example.com/panorama/?countries=BRA%2CPER&indicator=growth&from=2000&to=2024&lang=pt-BR')
  })
})
