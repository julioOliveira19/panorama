import { LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { init, use as registerECharts } from 'echarts/core'
import type { EChartsOption } from 'echarts'
import { SVGRenderer } from 'echarts/renderers'
import { useEffect, useMemo, useRef } from 'react'
import { formatValue, statusLabel } from '../lib/format'
import { yearsInRange } from '../lib/calculations'
import type { ComparisonMode, Country, IndicatorKey, PanoramaData } from '../types'
import { countryColors, debtColors } from '../types'

registerECharts([LineChart, GridComponent, LegendComponent, TooltipComponent, SVGRenderer])

type TimeSeriesChartProps = {
  countries: Country[]
  mode: ComparisonMode
  series: PanoramaData['series']
  startYear: number
  endYear: number
}

type TooltipItem = {
  marker: string
  seriesName: string
  data?: {
    value?: number | null
    source?: string
    status?: string
    unit?: string
  } | number | null
  axisValue?: string
}

type ChartDatum = {
  value: number
  source: string
  status: string
  unit: string
} | null

export function TimeSeriesChart({
  countries,
  mode,
  series,
  startYear,
  endYear,
}: TimeSeriesChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const years = useMemo(() => yearsInRange(startYear, endYear), [startYear, endYear])

  useEffect(() => {
    if (!chartRef.current) return
    const chart = init(chartRef.current, undefined, { renderer: 'svg' })

    const indicators: IndicatorKey[] = mode === 'both' ? ['growth', 'debt'] : [mode]
    const chartSeries = countries.flatMap((country, countryIndex) =>
      indicators.flatMap((indicator) => {
        const pointByYear = new Map(
          (series[indicator][country.code] ?? []).map((point) => [point.year, point]),
        )
        const color = mode === 'both' && indicator === 'debt'
          ? debtColors[countryIndex]
          : countryColors[countryIndex]
        const unit = indicator === 'growth' ? '%' : '% do PIB'
        const observed: ChartDatum[] = years.map((year) => {
          const point = pointByYear.get(year)
          if (!point || point.status === 'projection') return null
          return { value: point.value, source: point.source, status: point.status, unit }
        })
        const projected: ChartDatum[] = years.map((year) => {
          const point = pointByYear.get(year)
          if (!point || point.status !== 'projection') return null
          return { value: point.value, source: point.source, status: point.status, unit }
        })

        const firstProjection = projected.findIndex(Boolean)
        if (firstProjection > 0 && observed[firstProjection - 1]) {
          projected[firstProjection - 1] = observed[firstProjection - 1]
        }

        const name = mode === 'both'
          ? `${country.name} · ${indicator === 'growth' ? 'PIB' : 'Dívida'}`
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
        textStyle: { color: '#34433e', fontFamily: 'system-ui' },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#10251f',
        borderWidth: 0,
        textStyle: { color: '#fff' },
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
            lines.push(
              `${item.marker}${item.seriesName}: <strong>${formatValue(data?.value)}${data?.unit ? ` ${data.unit}` : ''}</strong>` +
              `<small style="display:block;margin-left:18px;opacity:.72">${data?.source ?? ''} · ${statusLabel(data?.status ?? '')}</small>`,
            )
          }
          return lines.join('<br/>')
        },
      },
      xAxis: {
        type: 'category',
        data: years.map(String),
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#b8c4bf' } },
        axisLabel: { color: '#61706b', hideOverlap: true },
      },
      yAxis: mode === 'both'
        ? [
            {
              type: 'value',
              name: 'PIB · % ao ano',
              nameTextStyle: { color: '#61706b', padding: [0, 0, 8, 0] },
              axisLabel: { color: '#61706b', formatter: (value: number) => formatValue(value) },
              splitLine: { lineStyle: { color: '#e7ece9' } },
            },
            {
              type: 'value',
              name: 'Dívida · % do PIB',
              nameTextStyle: { color: '#61706b', padding: [0, 0, 8, 0] },
              axisLabel: { color: '#61706b', formatter: (value: number) => formatValue(value) },
              splitLine: { show: false },
            },
          ]
        : {
            type: 'value',
            name: mode === 'growth' ? '% ao ano' : '% do PIB',
            nameTextStyle: { color: '#61706b', padding: [0, 0, 8, 0] },
            axisLabel: { color: '#61706b', formatter: (value: number) => formatValue(value) },
            splitLine: { lineStyle: { color: '#e7ece9' } },
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
  }, [countries, endYear, mode, series, startYear, years])

  const title = mode === 'growth'
    ? 'Crescimento real do PIB'
    : mode === 'debt'
      ? 'Dívida pública bruta'
      : 'Crescimento do PIB × dívida pública'

  return (
    <section className="panel chart-panel" aria-labelledby="chart-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Série anual</p>
          <h2 id="chart-title">{title}</h2>
        </div>
        <div className="chart-keys" aria-label="Legenda de estilos">
          {mode === 'both' && (
            <>
              <span className="chart-key"><i className="key-growth" /> PIB</span>
              <span className="chart-key"><i className="key-debt" /> Dívida</span>
            </>
          )}
          <span className="chart-key"><i className="key-projection" /> Projeção WEO</span>
        </div>
      </div>
      <div ref={chartRef} className="chart" role="img" aria-label={`Gráfico anual de ${title.toLowerCase()}`} />
    </section>
  )
}
