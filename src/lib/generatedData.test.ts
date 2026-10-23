import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { panoramaDataSchema } from '../types'

describe('dados gerados', () => {
  it('valida o arquivo completo e preserva lacunas dos indicadores per capita', async () => {
    const raw = await readFile(join(process.cwd(), 'public', 'data', 'panorama-data.json'), 'utf8')
    const data = panoramaDataSchema.parse(JSON.parse(raw))

    expect(data.countries.find(({ code }) => code === 'BRA')?.availability.gdpPerCapita)
      .toEqual({ minYear: 1990, maxYear: 2025, count: 36 })
    expect(data.countries.find(({ code }) => code === 'JPN')?.availability.consumptionPerCapita)
      .toEqual({ minYear: 1990, maxYear: 2024, count: 35 })

    const perCapitaValues = [
      ...Object.values(data.series.gdpPerCapita).flat(),
      ...Object.values(data.series.consumptionPerCapita).flat(),
    ]
    expect(perCapitaValues.length).toBeGreaterThan(0)
    expect(perCapitaValues.some(({ value }) => value === 0)).toBe(false)
  })
})
