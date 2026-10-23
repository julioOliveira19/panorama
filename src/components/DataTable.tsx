import { yearsInRange } from '../lib/calculations'
import { formatValue, statusLabel } from '../lib/format'
import type { Country, DataPoint } from '../types'
import { countryColors } from '../types'

type DataTableProps = {
  countries: Country[]
  series: Record<string, DataPoint[]>
  startYear: number
  endYear: number
}

export function DataTable({ countries, series, startYear, endYear }: DataTableProps) {
  const years = yearsInRange(startYear, endYear)
  const lookups = new Map(
    countries.map((country) => [
      country.code,
      new Map((series[country.code] ?? []).map((point) => [point.year, point])),
    ]),
  )

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
              {countries.map((country, index) => (
                <th key={country.code}>
                  <span className="table-country-dot" style={{ background: countryColors[index] }} />
                  {country.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {years.map((year) => (
              <tr key={year}>
                <th scope="row">{year}</th>
                {countries.map((country) => {
                  const point = lookups.get(country.code)?.get(year)
                  return (
                    <td key={country.code} className={!point ? 'is-missing' : ''}>
                      <strong>{formatValue(point?.value)}</strong>
                      {point && (
                        <small className={`status-${point.status}`}>
                          {point.source} · {statusLabel(point.status)}
                        </small>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
