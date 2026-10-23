import { z } from 'zod'

export const indicatorKeySchema = z.enum(['growth', 'debt'])
export type IndicatorKey = z.infer<typeof indicatorKeySchema>
export type ComparisonMode = IndicatorKey | 'both'

export const dataPointSchema = z.object({
  year: z.number().int(),
  value: z.number(),
  source: z.enum(['FPP', 'WEO']),
  status: z.enum(['observation', 'estimate', 'projection']),
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
      fppCode: z.string(),
      weoCode: z.string(),
    })),
    sources: z.array(z.object({
      id: z.enum(['FPP', 'WEO']),
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
    }),
  })),
  series: z.object({
    growth: z.record(z.string(), z.array(dataPointSchema)),
    debt: z.record(z.string(), z.array(dataPointSchema)),
  }),
})

export type PanoramaData = z.infer<typeof panoramaDataSchema>
export type Country = PanoramaData['countries'][number]

export type MapProperties = {
  code: string
  name: string
}

export type WorldMapData = GeoJSON.FeatureCollection<GeoJSON.Geometry, MapProperties>

export const countryColors = ['#2463eb', '#d97706', '#0f8a75', '#c24178', '#7557d3']
