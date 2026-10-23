import type { ComparisonMode, Country, IndicatorKey, PanoramaData } from '../types'
import type { Language } from '../types'
import { statusLabel } from './format'
import { translate } from './i18n'

function escapeCsv(value: string | number) {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function csvIndicator(language: Language, indicator: IndicatorKey) {
  if (indicator === 'growth') return translate(language, 'csv.growth')
  if (indicator === 'debt') return translate(language, 'csv.debt')
  if (indicator === 'gdpPerCapita') return translate(language, 'csv.gdpPerCapita')
  return translate(language, 'csv.consumptionPerCapita')
}

function csvUnit(language: Language, indicator: IndicatorKey) {
  if (indicator === 'growth') return '%'
  if (indicator === 'debt') return translate(language, 'unit.debt')
  return translate(language, 'unit.perCapita')
}

export function buildCsv(
  mode: ComparisonMode,
  countries: Country[],
  series: PanoramaData['series'],
  startYear: number,
  endYear: number,
  language: Language = 'pt-BR',
) {
  const rows: Array<Array<string | number>> = [[
    translate(language, 'csv.countryCode'),
    translate(language, 'csv.country'),
    translate(language, 'csv.year'),
    translate(language, 'csv.indicator'),
    translate(language, 'csv.value'),
    translate(language, 'csv.unit'),
    translate(language, 'csv.source'),
    translate(language, 'csv.status'),
  ]]
  const indicators: IndicatorKey[] = mode === 'both' ? ['growth', 'debt'] : [mode]

  for (const country of countries) {
    for (const indicator of indicators) {
      const points = (series[indicator][country.code] ?? []).filter(
        ({ year }) => year >= startYear && year <= endYear,
      )
      for (const point of points) {
        rows.push([
          country.code,
          country.name,
          point.year,
          csvIndicator(language, indicator),
          point.value,
          csvUnit(language, indicator),
          point.source,
          statusLabel(point.status, language),
        ])
      }
    }
  }

  return rows.map((row) => row.map(escapeCsv).join(',')).join('\n')
}

export function downloadCsv(content: string, filename: string) {
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
