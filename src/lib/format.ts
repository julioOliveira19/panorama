import { localeFor, translate } from './i18n'
import type { Language } from '../types'

const valueFormatters = new Map<Language, Intl.NumberFormat>()
const dateFormatters = new Map<Language, Intl.DateTimeFormat>()
const perCapitaFormatters = new Map<Language, Intl.NumberFormat>()

function valueFormatter(language: Language) {
  const existing = valueFormatters.get(language)
  if (existing) return existing
  const formatter = new Intl.NumberFormat(localeFor(language), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  })
  valueFormatters.set(language, formatter)
  return formatter
}

function dateFormatter(language: Language) {
  const existing = dateFormatters.get(language)
  if (existing) return existing
  const formatter = new Intl.DateTimeFormat(localeFor(language), {
    dateStyle: 'medium',
    timeZone: 'America/Sao_Paulo',
  })
  dateFormatters.set(language, formatter)
  return formatter
}

function perCapitaFormatter(language: Language) {
  const existing = perCapitaFormatters.get(language)
  if (existing) return existing
  const formatter = new Intl.NumberFormat(localeFor(language), {
    maximumFractionDigits: 0,
  })
  perCapitaFormatters.set(language, formatter)
  return formatter
}

export function formatValue(value: number | null | undefined, language: Language = 'pt-BR') {
  return value == null ? '—' : valueFormatter(language).format(value)
}

export function formatSigned(value: number | null | undefined, language: Language = 'pt-BR') {
  if (value == null) return '—'
  return `${value > 0 ? '+' : ''}${formatValue(value, language)}`
}

export function formatPerCapita(value: number | null | undefined, language: Language = 'pt-BR') {
  return value == null ? '—' : perCapitaFormatter(language).format(value)
}

export function formatSignedPerCapita(value: number | null | undefined, language: Language = 'pt-BR') {
  if (value == null) return '—'
  return `${value > 0 ? '+' : ''}${formatPerCapita(value, language)}`
}

export function formatDate(value: string, language: Language = 'pt-BR') {
  return dateFormatter(language).format(new Date(value))
}

export function statusLabel(status: string, language: Language = 'pt-BR') {
  if (status === 'projection') return translate(language, 'status.projection')
  if (status === 'estimate') return translate(language, 'status.estimate')
  if (status === 'published') return translate(language, 'status.published')
  return translate(language, 'status.observation')
}
