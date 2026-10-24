import isoCountries from 'i18n-iso-countries'

const nonIsoCountries = new Set(['UVK', 'WBG'])

export function isAggregateCode(code: string) {
  return !isoCountries.isValid(code) && !nonIsoCountries.has(code)
}
