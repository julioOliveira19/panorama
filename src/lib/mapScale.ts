import type { IndicatorKey } from '../types'

type Rgb = [number, number, number]

const palettes: Record<IndicatorKey, [Rgb, Rgb, Rgb]> = {
  growth: [[177, 67, 67], [232, 231, 221], [21, 122, 96]],
  debt: [[224, 237, 232], [99, 159, 139], [14, 92, 70]],
  gdpPerCapita: [[230, 237, 248], [107, 150, 205], [31, 77, 145]],
  consumptionPerCapita: [[247, 232, 205], [220, 157, 86], [166, 78, 15]],
}

function quantile(values: number[], position: number) {
  if (!values.length) return 0
  const sorted = [...values].sort((left, right) => left - right)
  const index = (sorted.length - 1) * position
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower)
}

function interpolate(from: Rgb, to: Rgb, amount: number) {
  const channels = from.map((channel, index) => Math.round(channel + (to[index] - channel) * amount))
  return `rgb(${channels.join(', ')})`
}

export type MapColorScale = {
  min: number
  midpoint: number
  max: number
  color: (value: number) => string
}

export function buildMapColorScale(values: number[], indicator: IndicatorKey): MapColorScale {
  const finite = values.filter(Number.isFinite)
  const [low, middle, high] = palettes[indicator]

  if (indicator === 'growth') {
    const maxAbs = Math.max(1, quantile(finite.map(Math.abs), .95))
    return {
      min: -maxAbs,
      midpoint: 0,
      max: maxAbs,
      color: (value) => value <= 0
        ? interpolate(low, middle, Math.max(0, Math.min(1, (value + maxAbs) / maxAbs)))
        : interpolate(middle, high, Math.max(0, Math.min(1, value / maxAbs))),
    }
  }

  let min = quantile(finite, .05)
  let max = quantile(finite, .95)
  if (min === max) {
    min -= 1
    max += 1
  }
  const logarithmic = indicator === 'gdpPerCapita' || indicator === 'consumptionPerCapita'
  const transform = (value: number) => logarithmic ? Math.log1p(Math.max(0, value)) : value
  const transformedMin = transform(min)
  const transformedMax = transform(max)
  const midpoint = logarithmic ? Math.expm1((transformedMin + transformedMax) / 2) : (min + max) / 2

  return {
    min,
    midpoint,
    max,
    color: (value) => {
      const amount = Math.max(0, Math.min(1, (transform(value) - transformedMin) / (transformedMax - transformedMin)))
      return amount <= .5
        ? interpolate(low, middle, amount * 2)
        : interpolate(middle, high, (amount - .5) * 2)
    },
  }
}
