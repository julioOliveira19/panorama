import { useMemo } from 'react'
import { translate } from '../lib/i18n'
import type { ComparisonMode, Country, DataPoint, IndicatorKey, Language, PanoramaData } from '../types'

type ChartSourceNoteProps = {
  countries: Country[]
  mode: ComparisonMode
  series: PanoramaData['series']
  startYear: number
  endYear: number
  language: Language
}

export function ChartSourceNote({
  countries,
  mode,
  series,
  startYear,
  endYear,
  language,
}: ChartSourceNoteProps) {
  const sourceCoverage = useMemo(() => {
    const indicators: IndicatorKey[] = mode === 'both' ? ['growth', 'debt'] : [mode]
    const coverage = new Map<DataPoint['source'], {
      source: DataPoint['source']
      minYear: number
      maxYear: number
      hasProjection: boolean
    }>()

    for (const country of countries) {
      for (const indicator of indicators) {
        for (const point of series[indicator][country.code] ?? []) {
          if (point.year < startYear || point.year > endYear) continue
          const current = coverage.get(point.source)
          if (!current) {
            coverage.set(point.source, {
              source: point.source,
              minYear: point.year,
              maxYear: point.year,
              hasProjection: point.status === 'projection',
            })
            continue
          }
          current.minYear = Math.min(current.minYear, point.year)
          current.maxYear = Math.max(current.maxYear, point.year)
          current.hasProjection ||= point.status === 'projection'
        }
      }
    }

    const order: DataPoint['source'][] = ['FPP', 'WEO', 'WB']
    return [...coverage.values()].sort(
      (left, right) => order.indexOf(left.source) - order.indexOf(right.source),
    )
  }, [countries, endYear, mode, series, startYear])

  const sourceName = (source: DataPoint['source']) => translate(
    language,
    source === 'FPP' ? 'source.fppShort' : source === 'WEO' ? 'source.weoShort' : 'source.wbShort',
  )

  return (
    <aside className="chart-source-note" role="note">
      {sourceCoverage.length > 0 ? (
        <p>
          <strong>{translate(language, 'chart.sourceIntro')}:</strong>{' '}
          {sourceCoverage.map(({ source, minYear, maxYear, hasProjection }, index) => (
            <span className="source-range" key={source}>
              {index > 0 && <span aria-hidden="true"> · </span>}
              {sourceName(source)}: {minYear === maxYear ? minYear : `${minYear}–${maxYear}`}
              {hasProjection ? ` (${translate(language, 'status.projection')})` : ''}
            </span>
          ))}
          <span className="source-detail"> — {translate(language, 'chart.sourceVariation')}</span>
        </p>
      ) : (
        <p><strong>{translate(language, 'chart.sourceIntro')}:</strong> {translate(language, 'chart.sourceNoData')}</p>
      )}
    </aside>
  )
}
