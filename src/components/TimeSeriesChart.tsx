import { LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { init, use as registerECharts } from 'echarts/core'
import type { EChartsOption } from 'echarts'
import { SVGRenderer } from 'echarts/renderers'
import { useEffect, useMemo, useRef } from 'react'
import { formatPerCapita, formatValue, statusLabel } from '../lib/format'
import { yearsInRange } from '../lib/calculations'
import { translate } from '../lib/i18n'
import type { ComparisonMode, Country, DataPoint, IndicatorKey, Language, PanoramaData, Theme } from '../types'
import { countryColors, debtColors } from '../types'

registerECharts([LineChart, GridComponent, LegendComponent, TooltipComponent, SVGRenderer])

type TimeSeriesChartProps = {
  countries: Country[]
  mode: ComparisonMode
  series: PanoramaData['series']
  startYear: number
  endYear: number
  theme: Theme
  language: Language
}

type TooltipItem = {
  marker: string
  seriesName: string
  data?: {
    value?: number | null
    source?: string
    status?: string
    unit?: string
    indicator?: IndicatorKey
  } | number | null
  axisValue?: string
}

type ChartDatum = {
  value: number
  source: string
  status: string
  unit: string
  indicator: IndicatorKey
} | null

export function TimeSeriesChart({
  countries,
  mode,
  series,
  startYear,
  endYear,
  theme,
  language,
}: TimeSeriesChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const years = useMemo(() => yearsInRange(startYear, endYear), [startYear, endYear])
  const activeIndicators = useMemo<IndicatorKey[]>(
    () => mode === 'both' ? ['growth', 'debt'] : [mode],
    [mode],
  )
  const sourceCoverage = useMemo(() => {
    const coverage = new Map<DataPoint['source'], {
      source: DataPoint['source']
      minYear: number
      maxYear: number
      hasProjection: boolean
    }>()

    for (const country of countries) {
      for (const indicator of activeIndicators) {
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
  }, [activeIndicators, countries, endYear, series, startYear])

  useEffect(() => {
    if (!chartRef.current) return
    const chart = init(chartRef.current, undefined, { renderer: 'svg' })
    const chartUi = theme === 'dark'
      ? {
          text: '#a4b2ac',
          textStrong: '#dce7e2',
          axis: '#56635e',
          grid: '#2d3934',
          tooltipBackground: '#e7f0eb',
          tooltipText: '#13201b',
        }
      : {
          text: '#61706b',
          textStrong: '#34433e',
          axis: '#b8c4bf',
          grid: '#e7ece9',
          tooltipBackground: '#10251f',
          tooltipText: '#fff',
        }

    const chartSeries = countries.flatMap((country, countryIndex) =>
      activeIndicators.flatMap((indicator) => {
        const pointByYear = new Map(
          (series[indicator][country.code] ?? []).map((point) => [point.year, point]),
        )
        const color = mode === 'both' && indicator === 'debt'
          ? debtColors[countryIndex]
          : countryColors[countryIndex]
        const unit = indicator === 'growth'
          ? '%'
          : indicator === 'debt'
            ? translate(language, 'unit.debt')
            : translate(language, 'unit.perCapita')
        const observed: ChartDatum[] = years.map((year) => {
          const point = pointByYear.get(year)
          if (!point || point.status === 'projection') return null
          return { value: point.value, source: point.source, status: point.status, unit, indicator }
        })
        const projected: ChartDatum[] = years.map((year) => {
          const point = pointByYear.get(year)
          if (!point || point.status !== 'projection') return null
          return { value: point.value, source: point.source, status: point.status, unit, indicator }
        })

        const firstProjection = projected.findIndex(Boolean)
        if (firstProjection > 0 && observed[firstProjection - 1]) {
          projected[firstProjection - 1] = observed[firstProjection - 1]
        }

        const name = mode === 'both'
          ? `${country.name} · ${translate(language, indicator === 'growth' ? 'chart.gdp' : 'chart.debt')}`
          : country.name
        const symbol = indicator === 'growth' ? 'circle' : 'diamond'

        return [
          {
            name,
            type: 'line' as const,
            yAxisIndex: mode === 'both' && indicator === 'debt' ? 1 : 0,
            data: observed,
            connectNulls: false,
            showSymbol: years.length <= 30,
            symbol,
            symbolSize: indicator === 'growth' ? 6 : 8,
            lineStyle: { width: indicator === 'growth' ? 3 : 2, color },
            itemStyle: { color },
            emphasis: { focus: 'series' as const },
          },
          {
            name,
            type: 'line' as const,
            yAxisIndex: mode === 'both' && indicator === 'debt' ? 1 : 0,
            data: projected,
            connectNulls: false,
            showSymbol: true,
            symbol,
            symbolSize: indicator === 'growth' ? 7 : 9,
            lineStyle: { width: 2, type: 'dashed' as const, color },
            itemStyle: { color, borderColor: '#fffefa', borderWidth: 2 },
            emphasis: { focus: 'series' as const },
          },
        ]
      }),
    )

    const option: EChartsOption = {
      animationDuration: 500,
      color: countryColors,
      grid: { top: 72, right: mode === 'both' ? 72 : 22, bottom: 56, left: 64, containLabel: false },
      legend: {
        top: 10,
        type: 'scroll',
        textStyle: { color: chartUi.textStrong, fontFamily: 'system-ui' },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: chartUi.tooltipBackground,
        borderWidth: 0,
        textStyle: { color: chartUi.tooltipText },
        formatter: (rawParams) => {
          const params = rawParams as unknown as TooltipItem[]
          const unique = new Map<string, TooltipItem>()
          for (const item of params) {
            const data = item.data
            const value = typeof data === 'object' && data ? data.value : data
            if (value != null) unique.set(item.seriesName, item)
          }
          const lines = [`<strong>${params[0]?.axisValue ?? ''}</strong>`]
          for (const item of unique.values()) {
            const data = typeof item.data === 'object' && item.data ? item.data : null
            const formattedValue = data?.indicator === 'gdpPerCapita' || data?.indicator === 'consumptionPerCapita'
              ? formatPerCapita(data?.value, language)
              : formatValue(data?.value, language)
            lines.push(
              `${item.marker}${item.seriesName}: <strong>${formattedValue}${data?.unit ? ` ${data.unit}` : ''}</strong>` +
              `<small style="display:block;margin-left:18px;opacity:.72">${data?.source ?? ''} · ${statusLabel(data?.status ?? '', language)}</small>`,
            )
          }
          return lines.join('<br/>')
        },
      },
      xAxis: {
        type: 'category',
        data: years.map(String),
        boundaryGap: false,
        axisLine: { lineStyle: { color: chartUi.axis } },
        axisLabel: { color: chartUi.text, hideOverlap: true },
      },
      yAxis: mode === 'both'
        ? [
            {
              type: 'value',
              name: translate(language, 'chart.growthAxis'),
              nameTextStyle: { color: chartUi.text, padding: [0, 0, 8, 0] },
              axisLabel: { color: chartUi.text, formatter: (value: number) => formatValue(value, language) },
              splitLine: { lineStyle: { color: chartUi.grid } },
            },
            {
              type: 'value',
              name: translate(language, 'chart.debtAxis'),
              nameTextStyle: { color: chartUi.text, padding: [0, 0, 8, 0] },
              axisLabel: { color: chartUi.text, formatter: (value: number) => formatValue(value, language) },
              splitLine: { show: false },
            },
          ]
        : {
            type: 'value',
            name: translate(
              language,
              mode === 'growth'
                ? 'chart.growthUnit'
                : mode === 'debt'
                  ? 'chart.debtUnit'
                  : mode === 'gdpPerCapita'
                    ? 'chart.gdpPerCapitaAxis'
                    : 'chart.consumptionPerCapitaAxis',
            ),
            nameTextStyle: { color: chartUi.text, padding: [0, 0, 8, 0] },
            axisLabel: {
              color: chartUi.text,
              formatter: (value: number) => mode === 'gdpPerCapita' || mode === 'consumptionPerCapita'
                ? formatPerCapita(value, language)
                : formatValue(value, language),
            },
            splitLine: { lineStyle: { color: chartUi.grid } },
          },
      series: chartSeries,
    }

    chart.setOption(option)
    const observer = new ResizeObserver(() => chart.resize())
    observer.observe(chartRef.current)
    return () => {
      observer.disconnect()
      chart.dispose()
    }
  }, [activeIndicators, countries, endYear, language, mode, series, startYear, theme, years])

  const title = translate(
    language,
    mode === 'growth'
      ? 'chart.growthTitle'
      : mode === 'debt'
        ? 'chart.debtTitle'
        : mode === 'gdpPerCapita'
          ? 'chart.gdpPerCapitaTitle'
          : mode === 'consumptionPerCapita'
            ? 'chart.consumptionPerCapitaTitle'
            : 'chart.bothTitle',
  )
  const sourceDescription = translate(
    language,
    mode === 'gdpPerCapita' || mode === 'consumptionPerCapita'
      ? 'chart.sourceWdiDescription'
      : 'chart.sourceFppWoeDescription',
  )
  const sourceName = (source: DataPoint['source']) => translate(
    language,
    source === 'FPP' ? 'source.fppShort' : source === 'WEO' ? 'source.weoShort' : 'source.wbShort',
  )

  return (
    <section className="panel chart-panel" aria-labelledby="chart-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{translate(language, 'chart.eyebrow')}</p>
          <h2 id="chart-title">{title}</h2>
        </div>
        <div className="chart-keys" aria-label={translate(language, 'chart.stylesLegend')}>
          {mode === 'both' && (
            <>
              <span className="chart-key"><i className="key-growth" /> {translate(language, 'chart.gdp')}</span>
              <span className="chart-key"><i className="key-debt" /> {translate(language, 'chart.debt')}</span>
            </>
          )}
          {(mode === 'growth' || mode === 'debt' || mode === 'both') && (
            <span className="chart-key"><i className="key-projection" /> {translate(language, 'chart.projection')}</span>
          )}
        </div>
      </div>
      <div className="chart-source-note" role="note">
        <p><strong>{translate(language, 'chart.sourceIntro')}:</strong> {sourceDescription}</p>
        {sourceCoverage.length > 0 ? (
          <div className="source-ranges">
            {sourceCoverage.map(({ source, minYear, maxYear, hasProjection }) => (
              <span key={source}>
                {sourceName(source)} · {minYear === maxYear ? minYear : `${minYear}–${maxYear}`}
                {hasProjection ? ` · ${translate(language, 'status.projection')}` : ''}
              </span>
            ))}
          </div>
        ) : (
          <span className="source-empty">{translate(language, 'chart.sourceNoData')}</span>
        )}
        <small>{translate(language, 'chart.sourceVariation')}</small>
      </div>
      <div ref={chartRef} className="chart" role="img" aria-label={translate(language, 'chart.aria', { title: title.toLowerCase() })} />
    </section>
  )
}
