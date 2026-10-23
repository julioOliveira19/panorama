import type { DataPoint, IndicatorKey } from '../types'

export type GrowthSummary = {
  average: number | null
  cumulative: number | null
  validYears: number
  missingYears: number
}

export type DebtSummary = {
  initial: number | null
  final: number | null
  change: number | null
  validYears: number
  missingYears: number
}

export function yearsInRange(startYear: number, endYear: number) {
  return Array.from(
    { length: Math.max(0, endYear - startYear + 1) },
    (_, index) => startYear + index,
  )
}

export function pointsInRange(points: DataPoint[], startYear: number, endYear: number) {
  return points.filter(({ year }) => year >= startYear && year <= endYear)
}

export function growthSummary(
  points: DataPoint[],
  startYear: number,
  endYear: number,
): GrowthSummary {
  const selected = pointsInRange(points, startYear, endYear)
  const values = selected.map(({ value }) => value)
  const totalYears = yearsInRange(startYear, endYear).length

  if (values.length === 0) {
    return { average: null, cumulative: null, validYears: 0, missingYears: totalYears }
  }

  const average = values.reduce((sum, value) => sum + value, 0) / values.length
  const cumulative = (
    values.reduce((factor, value) => factor * (1 + value / 100), 1) - 1
  ) * 100

  return {
    average,
    cumulative,
    validYears: values.length,
    missingYears: totalYears - values.length,
  }
}

export function debtSummary(
  points: DataPoint[],
  startYear: number,
  endYear: number,
): DebtSummary {
  const selected = pointsInRange(points, startYear, endYear)
  const totalYears = yearsInRange(startYear, endYear).length

  if (selected.length === 0) {
    return { initial: null, final: null, change: null, validYears: 0, missingYears: totalYears }
  }

  const initial = selected[0].value
  const final = selected.at(-1)?.value ?? initial
  return {
    initial,
    final,
    change: final - initial,
    validYears: selected.length,
    missingYears: totalYears - selected.length,
  }
}

export function summarize(
  indicator: IndicatorKey,
  points: DataPoint[],
  startYear: number,
  endYear: number,
) {
  return indicator === 'growth'
    ? growthSummary(points, startYear, endYear)
    : debtSummary(points, startYear, endYear)
}
