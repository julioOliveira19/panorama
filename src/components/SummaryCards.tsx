import { debtSummary, growthSummary, levelSummary } from '../lib/calculations'
import { formatPerCapita, formatSigned, formatSignedPerCapita, formatValue } from '../lib/format'
import { translate } from '../lib/i18n'
import type { ComparisonMode, Country, Language, PanoramaData } from '../types'
import { countryColors } from '../types'

type SummaryCardsProps = {
  countries: Country[]
  mode: ComparisonMode
  series: PanoramaData['series']
  startYear: number
  endYear: number
  language: Language
}

export function SummaryCards({
  countries,
  mode,
  series,
  startYear,
  endYear,
  language,
}: SummaryCardsProps) {
  return (
    <section className="summary-section" aria-labelledby="summary-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{translate(language, 'summary.eyebrow')}</p>
          <h2 id="summary-title">{translate(language, 'summary.title', { start: startYear, end: endYear })}</h2>
        </div>
        <p>{translate(language, 'summary.note')}</p>
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
                    <span>{translate(language, 'summary.averageGrowth')}</span>
                    <strong>{formatValue(growth.average, language)}%</strong>
                    <small>{translate(language, 'summary.accumulated', { value: formatSigned(growth.cumulative, language) })}</small>
                  </div>
                  <div>
                    <span>{translate(language, 'summary.debtPeriod')}</span>
                    <strong>{formatSigned(debt.change, language)} p.p.</strong>
                    <small>{translate(language, 'summary.debtRange', { initial: formatValue(debt.initial, language), final: formatValue(debt.final, language) })}</small>
                  </div>
                </div>
                <p className="summary-coverage">
                  {translate(language, 'summary.validBoth', { growth: growth.validYears, debt: debt.validYears })}
                </p>
              </article>
            )
          }

          if (mode === 'growth') {
            return (
              <article className="summary-card" key={country.code} style={{ '--country-color': countryColors[index] } as React.CSSProperties}>
                <h3>{country.name}</h3>
                <div className="summary-primary">
                  <strong>{formatValue(growth.average, language)}%</strong>
                  <span>{translate(language, 'summary.annualAverage')}</span>
                </div>
                <dl>
                  <div><dt>{translate(language, 'summary.cumulativeGrowth')}</dt><dd>{formatSigned(growth.cumulative, language)}%</dd></div>
                  <div><dt>{translate(language, 'summary.validYears')}</dt><dd>{growth.validYears}</dd></div>
                  <div><dt>{translate(language, 'summary.missingYears')}</dt><dd>{growth.missingYears}</dd></div>
                </dl>
              </article>
            )
          }

          if (mode === 'debt') {
            return (
              <article className="summary-card" key={country.code} style={{ '--country-color': countryColors[index] } as React.CSSProperties}>
                <h3>{country.name}</h3>
                <div className="summary-primary">
                  <strong>{formatSigned(debt.change, language)} p.p.</strong>
                  <span>{translate(language, 'summary.periodChange')}</span>
                </div>
                <dl>
                  <div><dt>{translate(language, 'summary.initialValue')}</dt><dd>{formatValue(debt.initial, language)}%</dd></div>
                  <div><dt>{translate(language, 'summary.finalValue')}</dt><dd>{formatValue(debt.final, language)}%</dd></div>
                  <div><dt>{translate(language, 'summary.validMissing')}</dt><dd>{debt.validYears} / {debt.missingYears}</dd></div>
                </dl>
              </article>
            )
          }

          const level = levelSummary(series[mode][country.code] ?? [], startYear, endYear)
          return (
            <article className="summary-card" key={country.code} style={{ '--country-color': countryColors[index] } as React.CSSProperties}>
              <h3>{country.name}</h3>
              <div className="summary-primary">
                <strong>{formatPerCapita(level.final, language)}</strong>
                <span>{translate(language, 'summary.latestValue')} · {translate(language, 'unit.perCapita')}</span>
              </div>
              <dl>
                <div><dt>{translate(language, 'summary.periodGrowth')}</dt><dd>{formatSigned(level.percentChange, language)}%</dd></div>
                <div><dt>{translate(language, 'summary.annualizedGrowth')}</dt><dd>{formatSigned(level.annualizedChange, language)}%</dd></div>
                <div><dt>{translate(language, 'summary.absoluteChange')}</dt><dd>{formatSignedPerCapita(level.absoluteChange, language)}</dd></div>
                <div><dt>{translate(language, 'summary.validMissing')}</dt><dd>{level.validYears} / {level.missingYears}</dd></div>
              </dl>
            </article>
          )
        })}
      </div>
    </section>
  )
}
