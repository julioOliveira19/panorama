import type { ComparisonMode, Language } from '../types'

export type ComparisonUrlState = {
  countries: string[]
  mode: ComparisonMode
  startYear: number
  endYear: number
  language?: Language
}

const modes: ComparisonMode[] = ['growth', 'debt', 'gdpPerCapita', 'consumptionPerCapita', 'both']
const languages: Language[] = ['pt-BR', 'en', 'es']

function validYear(raw: string | null) {
  if (!raw) return undefined
  const year = Number(raw)
  return Number.isInteger(year) && year >= 1800 && year <= 2031 ? year : undefined
}

export function parseComparisonUrl(search: string): Partial<ComparisonUrlState> {
  const params = new URLSearchParams(search)
  const rawCountries = params.get('countries')
  const rawMode = params.get('indicator') as ComparisonMode | null
  const rawLanguage = params.get('lang') as Language | null
  const from = validYear(params.get('from'))
  const to = validYear(params.get('to'))
  const state: Partial<ComparisonUrlState> = {}

  if (rawCountries) {
    state.countries = [...new Set(
      rawCountries
        .split(',')
        .map((code) => code.trim().toUpperCase())
        .filter((code) => /^[A-Z0-9]{2,10}$/.test(code)),
    )].slice(0, 5)
  }
  if (rawMode && modes.includes(rawMode)) state.mode = rawMode
  if (rawLanguage && languages.includes(rawLanguage)) state.language = rawLanguage
  if (from !== undefined && to !== undefined) {
    state.startYear = Math.min(from, to)
    state.endYear = Math.max(from, to)
  } else {
    if (from !== undefined) state.startYear = from
    if (to !== undefined) state.endYear = to
  }

  return state
}

export function comparisonSearch(state: ComparisonUrlState) {
  const params = new URLSearchParams()
  params.set('countries', state.countries.join(','))
  params.set('indicator', state.mode)
  params.set('from', String(state.startYear))
  params.set('to', String(state.endYear))
  if (state.language) params.set('lang', state.language)
  return `?${params.toString()}`
}

export function comparisonUrl(state: ComparisonUrlState, location: Pick<Location, 'origin' | 'pathname'>) {
  return `${location.origin}${location.pathname}${comparisonSearch(state)}`
}
