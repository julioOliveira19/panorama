import { debtSummary, growthSummary } from '../lib/calculations'
import { formatSigned, formatValue } from '../lib/format'
import type { Country, DataPoint, IndicatorKey } from '../types'
import { countryColors } from '../types'

type SummaryCardsProps = {
  countries: Country[]
  indicator: IndicatorKey
  series: Record<string, DataPoint[]>
  startYear: number
  endYear: number
}

export function SummaryCards({
  countries,
  indicator,
  series,
  startYear,
  endYear,
}: SummaryCardsProps) {
  return (
    <section className="summary-section" aria-labelledby="summary-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Resumo do período</p>
          <h2 id="summary-title">O que aconteceu entre {startYear} e {endYear}</h2>
        </div>
        <p>Os cálculos ignoram lacunas; anos sem dados nunca entram como zero.</p>
      </div>
      <div className="summary-grid">
        {countries.map((country, index) => {
          const points = series[country.code] ?? []
          if (indicator === 'growth') {
            const summary = growthSummary(points, startYear, endYear)
            return (
              <article className="summary-card" key={country.code} style={{ '--country-color': countryColors[index] } as React.CSSProperties}>
                <h3>{country.name}</h3>
                <div className="summary-primary">
                  <strong>{formatValue(summary.average)}%</strong>
                  <span>média anual</span>
                </div>
                <dl>
                  <div><dt>Crescimento acumulado</dt><dd>{formatSigned(summary.cumulative)}%</dd></div>
                  <div><dt>Anos válidos</dt><dd>{summary.validYears}</dd></div>
                  <div><dt>Anos ausentes</dt><dd>{summary.missingYears}</dd></div>
                </dl>
              </article>
            )
          }

          const summary = debtSummary(points, startYear, endYear)
          return (
            <article className="summary-card" key={country.code} style={{ '--country-color': countryColors[index] } as React.CSSProperties}>
              <h3>{country.name}</h3>
              <div className="summary-primary">
                <strong>{formatSigned(summary.change)} p.p.</strong>
                <span>variação no período</span>
              </div>
              <dl>
                <div><dt>Valor inicial</dt><dd>{formatValue(summary.initial)}%</dd></div>
                <div><dt>Valor final</dt><dd>{formatValue(summary.final)}%</dd></div>
                <div><dt>Anos válidos / ausentes</dt><dd>{summary.validYears} / {summary.missingYears}</dd></div>
              </dl>
            </article>
          )
        })}
      </div>
    </section>
  )
}
