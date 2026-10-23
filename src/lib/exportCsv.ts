import type { Country, DataPoint, IndicatorKey } from '../types'

function escapeCsv(value: string | number) {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function buildCsv(
  indicator: IndicatorKey,
  countries: Country[],
  series: Record<string, DataPoint[]>,
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
  const unit = indicator === 'growth' ? '%' : '% do PIB'

  for (const country of countries) {
    const points = (series[country.code] ?? []).filter(
      ({ year }) => year >= startYear && year <= endYear,
    )
    for (const point of points) {
      rows.push([
        country.code,
        country.name,
        point.year,
        indicator,
        point.value,
        unit,
        point.source,
        point.status,
      ])
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
