import { useMemo, useState } from 'react'
import { translate } from '../lib/i18n'
import type { Country, Language } from '../types'
import { countryColors } from '../types'

type CountrySelectorProps = {
  countries: Country[]
  selectedCodes: string[]
  onToggle: (code: string) => void
  onRemove: (code: string) => void
  language: Language
}

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export function CountrySelector({
  countries,
  selectedCodes,
  onToggle,
  onRemove,
  language,
}: CountrySelectorProps) {
  const [query, setQuery] = useState('')
  const selected = countries.filter(({ code }) => selectedCodes.includes(code))
  const results = useMemo(() => {
    const term = normalize(query.trim())
    return countries
      .filter(({ code, name }) => !term || normalize(`${name} ${code}`).includes(term))
      .slice(0, 10)
  }, [countries, query])

  return (
    <div className="country-picker">
      <div className="selected-countries" aria-label={translate(language, 'countries.selected')}>
        {selected.map((country) => {
          const color = countryColors[selectedCodes.indexOf(country.code)]
          return (
            <button
              className="country-chip"
              key={country.code}
              onClick={() => onRemove(country.code)}
              style={{ '--country-color': color } as React.CSSProperties}
              type="button"
              title={translate(language, 'countries.remove', { country: country.name })}
            >
              <span className="country-dot" />
              {country.name}
              <span aria-hidden="true">×</span>
            </button>
          )
        })}
        <span className="selection-count">{translate(language, 'countries.count', { count: selectedCodes.length })}</span>
      </div>

      <label className="search-field">
        <span>{translate(language, 'countries.addLabel')}</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={translate(language, 'countries.searchPlaceholder')}
        />
      </label>

      {query && (
        <div className="country-results" role="listbox" aria-label={translate(language, 'countries.searchResults')}>
          {results.map((country) => {
            const isSelected = selectedCodes.includes(country.code)
            const isDisabled = !isSelected && selectedCodes.length >= 5
            return (
              <button
                key={country.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={isDisabled}
                onClick={() => {
                  onToggle(country.code)
                  setQuery('')
                }}
              >
                <span>{country.name}</span>
                <small>{country.code}</small>
                <strong>{translate(language, isSelected ? 'countries.selectedStatus' : 'countries.add')}</strong>
              </button>
            )
          })}
          {results.length === 0 && <p>{translate(language, 'countries.none')}</p>}
        </div>
      )}
    </div>
  )
}
