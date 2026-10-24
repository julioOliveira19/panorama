import { translate } from '../lib/i18n'
import type { Language } from '../types'

const countryPresets = [
  { key: 'presets.bricsOriginal' as const, codes: ['BRA', 'RUS', 'IND', 'CHN', 'ZAF'] },
  { key: 'presets.mercosur' as const, codes: ['ARG', 'BOL', 'BRA', 'PRY', 'URY'] },
  { key: 'presets.largeEconomies' as const, codes: ['BRA', 'USA', 'CHN'] },
  { key: 'presets.northAmerica' as const, codes: ['CAN', 'USA', 'MEX'] },
]

const periodPresets = [
  { key: 'presets.century' as const, startYear: 2000, endYear: 2025 },
  { key: 'presets.pandemic' as const, startYear: 2019, endYear: 2025 },
  { key: 'presets.longRun' as const, startYear: 1980, endYear: 2025 },
]

type ComparisonPresetsProps = {
  language: Language
  selectedCodes: string[]
  startYear: number
  endYear: number
  onCountries: (codes: string[]) => void
  onPeriod: (startYear: number, endYear: number) => void
}

export function ComparisonPresets({
  language,
  selectedCodes,
  startYear,
  endYear,
  onCountries,
  onPeriod,
}: ComparisonPresetsProps) {
  const selectedKey = [...selectedCodes].sort().join(',')

  return (
    <section className="preset-bar" aria-label={translate(language, 'presets.label')}>
      <div className="preset-group">
        <span>{translate(language, 'presets.countries')}</span>
        <div className="preset-buttons">
          {countryPresets.map((preset) => (
            <button
              key={preset.key}
              type="button"
              aria-pressed={[...preset.codes].sort().join(',') === selectedKey}
              onClick={() => onCountries(preset.codes)}
            >
              {translate(language, preset.key)}
            </button>
          ))}
        </div>
      </div>
      <div className="preset-group">
        <span>{translate(language, 'presets.periods')}</span>
        <div className="preset-buttons">
          {periodPresets.map((preset) => (
            <button
              key={preset.key}
              type="button"
              aria-pressed={startYear === preset.startYear && endYear === preset.endYear}
              onClick={() => onPeriod(preset.startYear, preset.endYear)}
            >
              {translate(language, preset.key)}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
