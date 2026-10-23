import type { ComparisonMode, Country, IndicatorKey, PanoramaData } from '../types'

function escapeCsv(value: string | number) {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function buildCsv(
  mode: ComparisonMode,
  countries: Country[],
  series: PanoramaData['series'],
  startYear: number,
  endYear: number,
) {
  const rows: Array<Array<string | number>> = [[
    'pais_codigo',
    'pais',
    'ano',
    'indicador',
    'valor',
    'unidade',
    'fonte',
    'status',
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
          indicator,
          point.value,
          indicator === 'growth' ? '%' : '% do PIB',
          point.source,
          point.status,
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
