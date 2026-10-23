import { debtSummary, growthSummary } from '../lib/calculations'
import { formatSigned, formatValue } from '../lib/format'
import type { ComparisonMode, Country, PanoramaData } from '../types'
import { countryColors } from '../types'

type SummaryCardsProps = {
  countries: Country[]
  mode: ComparisonMode
  series: PanoramaData['series']
  startYear: number
  endYear: number
}

export function SummaryCards({
  countries,
  mode,
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
          const growth = growthSummary(series.growth[country.code] ?? [], startYear, endYear)
          const debt = debtSummary(series.debt[country.code] ?? [], startYear, endYear)

          if (mode === 'both') {
            return (
              <article className="summary-card summary-card-both" key={country.code} style={{ '--country-color': countryColors[index] } as React.CSSProperties}>
                <h3>{country.name}</h3>
                <div className="summary-dual">
                  <div>
                    <span>Crescimento médio</span>
                    <strong>{formatValue(growth.average)}%</strong>
                    <small>Acumulado: {formatSigned(growth.cumulative)}%</small>
                  </div>
                  <div>
                    <span>Dívida no período</span>
                    <strong>{formatSigned(debt.change)} p.p.</strong>
                    <small>{formatValue(debt.initial)}% → {formatValue(debt.final)}% do PIB</small>
                  </div>
                </div>
                <p className="summary-coverage">
                  Anos válidos: PIB {growth.validYears} · Dívida {debt.validYears}
                </p>
              </article>
            )
          }

          if (mode === 'growth') {
            return (
              <article className="summary-card" key={country.code} style={{ '--country-color': countryColors[index] } as React.CSSProperties}>
                <h3>{country.name}</h3>
                <div className="summary-primary">
                  <strong>{formatValue(growth.average)}%</strong>
                  <span>média anual</span>
                </div>
                <dl>
                  <div><dt>Crescimento acumulado</dt><dd>{formatSigned(growth.cumulative)}%</dd></div>
                  <div><dt>Anos válidos</dt><dd>{growth.validYears}</dd></div>
                  <div><dt>Anos ausentes</dt><dd>{growth.missingYears}</dd></div>
                </dl>
              </article>
            )
          }

          return (
            <article className="summary-card" key={country.code} style={{ '--country-color': countryColors[index] } as React.CSSProperties}>
              <h3>{country.name}</h3>
              <div className="summary-primary">
                <strong>{formatSigned(debt.change)} p.p.</strong>
                <span>variação no período</span>
              </div>
              <dl>
                <div><dt>Valor inicial</dt><dd>{formatValue(debt.initial)}%</dd></div>
                <div><dt>Valor final</dt><dd>{formatValue(debt.final)}%</dd></div>
                <div><dt>Anos válidos / ausentes</dt><dd>{debt.validYears} / {debt.missingYears}</dd></div>
              </dl>
            </article>
          )
        })}
      </div>
    </section>
  )
}
