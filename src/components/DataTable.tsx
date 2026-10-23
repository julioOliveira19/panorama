import { yearsInRange } from '../lib/calculations'
import { formatValue, statusLabel } from '../lib/format'
import { translate } from '../lib/i18n'
import type { ComparisonMode, Country, IndicatorKey, Language, PanoramaData } from '../types'
import { countryColors, debtColors } from '../types'

type DataTableProps = {
  countries: Country[]
  mode: ComparisonMode
  series: PanoramaData['series']
  startYear: number
  endYear: number
  language: Language
}

export function DataTable({ countries, mode, series, startYear, endYear, language }: DataTableProps) {
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
          <p className="eyebrow">{translate(language, 'table.eyebrow')}</p>
          <h2 id="table-title">{translate(language, 'table.title')}</h2>
        </div>
        <p className="panel-help">{translate(language, 'table.missing')}</p>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>{translate(language, 'table.year')}</th>
              {countries.flatMap((country, index) => indicators.map((indicator) => (
                <th key={`${country.code}-${indicator}`}>
                  <span
                    className="table-country-dot"
                    style={{ background: mode === 'both' && indicator === 'debt' ? debtColors[index] : countryColors[index] }}
                  />
                  {country.name}{mode === 'both' ? ` · ${translate(language, indicator === 'growth' ? 'table.gdpShort' : 'table.debtShort')}` : ''}
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
                      <strong>{formatValue(point?.value, language)}</strong>
                      {point && (
                        <small className={`status-${point.status}`}>
                          {point.source} · {statusLabel(point.status, language)}
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
