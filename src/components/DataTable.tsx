import { yearsInRange } from '../lib/calculations'
import { formatValue, statusLabel } from '../lib/format'
import type { ComparisonMode, Country, IndicatorKey, PanoramaData } from '../types'
import { countryColors } from '../types'

type DataTableProps = {
  countries: Country[]
  mode: ComparisonMode
  series: PanoramaData['series']
  startYear: number
  endYear: number
}

const indicatorShortLabel: Record<IndicatorKey, string> = {
  growth: 'PIB (%)',
  debt: 'Dívida (% PIB)',
}

export function DataTable({ countries, mode, series, startYear, endYear }: DataTableProps) {
  const years = yearsInRange(startYear, endYear)
  const indicators: IndicatorKey[] = mode === 'both' ? ['growth', 'debt'] : [mode]
  const lookups = new Map(indicators.map((indicator) => [
    indicator,
    new Map(countries.map((country) => [
      country.code,
      new Map((series[indicator][country.code] ?? []).map((point) => [point.year, point])),
    ])),
  ]))

  return (
    <section className="panel table-panel" aria-labelledby="table-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Dados anuais</p>
          <h2 id="table-title">Tabela comparativa</h2>
        </div>
        <p className="panel-help">— significa ausência de dado, não zero.</p>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Ano</th>
              {countries.flatMap((country, index) => indicators.map((indicator) => (
                <th key={`${country.code}-${indicator}`}>
                  <span className="table-country-dot" style={{ background: countryColors[index] }} />
                  {country.name}{mode === 'both' ? ` · ${indicatorShortLabel[indicator]}` : ''}
                </th>
              )))}
            </tr>
          </thead>
          <tbody>
            {years.map((year) => (
              <tr key={year}>
                <th scope="row">{year}</th>
                {countries.flatMap((country) => indicators.map((indicator) => {
                  const point = lookups.get(indicator)?.get(country.code)?.get(year)
                  return (
                    <td key={`${country.code}-${indicator}`} className={!point ? 'is-missing' : ''}>
                      <strong>{formatValue(point?.value)}</strong>
                      {point && (
                        <small className={`status-${point.status}`}>
                          {point.source} · {statusLabel(point.status)}
                        </small>
                      )}
                    </td>
                  )
                }))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
