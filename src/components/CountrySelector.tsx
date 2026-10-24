import { useMemo, useState } from 'react'
import { isAggregateCode } from '../lib/entities'
import { translate } from '../lib/i18n'
import type { Country, Language } from '../types'
import { countryColor } from '../types'

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
      .slice(0, 12)
  }, [countries, query])
  const resultGroups = [
    {
      key: 'countries.countriesAndTerritories' as const,
      items: results.filter(({ code }) => !isAggregateCode(code)),
    },
    {
      key: 'countries.aggregates' as const,
      items: results.filter(({ code }) => isAggregateCode(code)),
    },
  ].filter(({ items }) => items.length > 0)

  return (
    <div className="country-picker">
      <div className="selected-countries" aria-label={translate(language, 'countries.selected')}>
        {selected.map((country) => {
          const color = countryColor(selectedCodes.indexOf(country.code))
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
          {resultGroups.map((group) => (
            <div className="country-result-group" role="group" aria-label={translate(language, group.key)} key={group.key}>
              <p className="country-result-heading">{translate(language, group.key)}</p>
              {group.items.map((country) => {
                const isSelected = selectedCodes.includes(country.code)
                return (
                  <button
                    key={country.code}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
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
            </div>
          ))}
          {results.length === 0 && <p>{translate(language, 'countries.none')}</p>}
        </div>
      )}
    </div>
  )
}
