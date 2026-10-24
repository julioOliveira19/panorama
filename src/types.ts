import { z } from 'zod'

export const indicatorKeySchema = z.enum(['growth', 'debt', 'gdpPerCapita', 'consumptionPerCapita'])
export type IndicatorKey = z.infer<typeof indicatorKeySchema>
export type ComparisonMode = IndicatorKey | 'both'
export type Theme = 'light' | 'dark'
export type Language = 'pt-BR' | 'en' | 'es'

export const dataPointSchema = z.object({
  year: z.number().int(),
  value: z.number(),
  source: z.enum(['FPP', 'WEO', 'WB']),
  status: z.enum(['observation', 'estimate', 'projection', 'published']),
})
export type DataPoint = z.infer<typeof dataPointSchema>

const availabilitySchema = z.object({
  minYear: z.number().int(),
  maxYear: z.number().int(),
  count: z.number().int(),
}).nullable()

export const panoramaDataSchema = z.object({
  meta: z.object({
    generatedAt: z.string(),
    methodology: z.string(),
    indicators: z.record(z.string(), z.object({
      label: z.string(),
      unit: z.string(),
      fppCode: z.string().optional(),
      weoCode: z.string().optional(),
      worldBankCode: z.string().optional(),
    })),
    sources: z.array(z.object({
      id: z.enum(['FPP', 'WEO', 'WB']),
      label: z.string(),
      url: z.string().url(),
      lastModified: z.string(),
      projectionYear: z.number().int().optional(),
    })),
  }),
  countries: z.array(z.object({
    code: z.string(),
    name: z.string(),
    availability: z.object({
      growth: availabilitySchema,
      debt: availabilitySchema,
      gdpPerCapita: availabilitySchema,
      consumptionPerCapita: availabilitySchema,
    }),
  })),
  series: z.object({
    growth: z.record(z.string(), z.array(dataPointSchema)),
    debt: z.record(z.string(), z.array(dataPointSchema)),
    gdpPerCapita: z.record(z.string(), z.array(dataPointSchema)),
    consumptionPerCapita: z.record(z.string(), z.array(dataPointSchema)),
  }),
})

export type PanoramaData = z.infer<typeof panoramaDataSchema>
export type Country = PanoramaData['countries'][number]

export type MapProperties = {
  code: string
  name: string
}

export type WorldMapData = GeoJSON.FeatureCollection<GeoJSON.Geometry, MapProperties>

export const countryColors = [
  '#2463eb', '#d97706', '#0f8a75', '#c24178', '#7557d3', '#2f855a',
  '#dc2626', '#0891b2', '#a16207', '#475569', '#db2777', '#65a30d',
]
export const debtColors = [
  '#7897e8', '#e5a34a', '#61ad9f', '#d884aa', '#a08bdd', '#79aa8a',
  '#e47b7b', '#70b7c8', '#c5a45b', '#8995a5', '#e583b0', '#9bbb5d',
]

export function countryColor(index: number) {
  if (index < countryColors.length) return countryColors[index]
  const hue = Math.round((index * 137.508) % 360)
  return `hsl(${hue} 68% 42%)`
}

export function debtColor(index: number) {
  if (index < debtColors.length) return debtColors[index]
  const hue = Math.round((index * 137.508) % 360)
  return `hsl(${hue} 45% 67%)`
}
