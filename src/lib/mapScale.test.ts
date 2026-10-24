import { describe, expect, it } from 'vitest'
import { buildMapColorScale } from './mapScale'

describe('escala temática do mapa', () => {
  it('centraliza crescimento em zero e limita extremos', () => {
    const scale = buildMapColorScale([-20, -2, 0, 3, 8, 100], 'growth')
    expect(scale.min).toBeLessThan(0)
    expect(scale.midpoint).toBe(0)
    expect(scale.max).toBeGreaterThan(0)
    expect(scale.color(-2)).not.toBe(scale.color(3))
  })

  it('cria escala sequencial para níveis per capita', () => {
    const scale = buildMapColorScale([1_000, 5_000, 20_000, 80_000], 'gdpPerCapita')
    expect(scale.min).toBeLessThan(scale.midpoint)
    expect(scale.midpoint).toBeLessThan(scale.max)
    expect(scale.color(1_000)).not.toBe(scale.color(80_000))
  })
})
