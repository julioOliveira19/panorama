import { LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { init, use as registerECharts } from 'echarts/core'
import type { EChartsOption } from 'echarts'
import { SVGRenderer } from 'echarts/renderers'
import { useEffect, useMemo, useRef } from 'react'
import { formatValue, statusLabel } from '../lib/format'
import { yearsInRange } from '../lib/calculations'
import type { Country, DataPoint, IndicatorKey } from '../types'
import { countryColors } from '../types'

registerECharts([LineChart, GridComponent, LegendComponent, TooltipComponent, SVGRenderer])

type TimeSeriesChartProps = {
  countries: Country[]
  indicator: IndicatorKey
  series: Record<string, DataPoint[]>
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
  } | number | null
  axisValue?: string
}

type ChartDatum = {
  value: number
  source: string
  status: string
} | null

export function TimeSeriesChart({
  countries,
  indicator,
  series,
  startYear,
  endYear,
}: TimeSeriesChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const years = useMemo(() => yearsInRange(startYear, endYear), [startYear, endYear])

  useEffect(() => {
    if (!chartRef.current) return
    const chart = init(chartRef.current, undefined, { renderer: 'svg' })

    const chartSeries = countries.flatMap((country, countryIndex) => {
      const pointByYear = new Map((series[country.code] ?? []).map((point) => [point.year, point]))
      const color = countryColors[countryIndex]
      const observed: ChartDatum[] = years.map((year) => {
        const point = pointByYear.get(year)
        if (!point || point.status === 'projection') return null
        return { value: point.value, source: point.source, status: point.status }
      })
      const projected: ChartDatum[] = years.map((year) => {
        const point = pointByYear.get(year)
        if (!point || point.status !== 'projection') return null
        return { value: point.value, source: point.source, status: point.status }
      })

      const firstProjection = projected.findIndex(Boolean)
      if (firstProjection > 0 && observed[firstProjection - 1]) {
        projected[firstProjection - 1] = observed[firstProjection - 1]
      }

      return [
        {
          name: country.name,
          type: 'line' as const,
          data: observed,
          connectNulls: false,
          showSymbol: years.length <= 30,
          symbolSize: 6,
          lineStyle: { width: 3, color },
          itemStyle: { color },
          emphasis: { focus: 'series' as const },
        },
        {
          name: country.name,
          type: 'line' as const,
          data: projected,
          connectNulls: false,
          showSymbol: true,
          symbol: 'emptyCircle',
          symbolSize: 7,
          lineStyle: { width: 2, type: 'dashed' as const, color },
          itemStyle: { color },
          emphasis: { focus: 'series' as const },
        },
      ]
    })

    const option: EChartsOption = {
      animationDuration: 500,
      color: countryColors,
      grid: { top: 72, right: 22, bottom: 56, left: 64, containLabel: false },
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
              `${item.marker}${item.seriesName}: <strong>${formatValue(data?.value)}</strong>` +
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
      yAxis: {
        type: 'value',
        name: indicator === 'growth' ? '%' : '% do PIB',
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
  }, [countries, endYear, indicator, series, startYear, years])

  return (
    <section className="panel chart-panel" aria-labelledby="chart-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Série anual</p>
          <h2 id="chart-title">
            {indicator === 'growth' ? 'Crescimento real do PIB' : 'Dívida pública bruta'}
          </h2>
        </div>
        <div className="chart-key"><span /> Projeção WEO</div>
      </div>
      <div ref={chartRef} className="chart" role="img" aria-label="Gráfico comparativo anual" />
    </section>
  )
}
