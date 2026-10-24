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
  const activeCountryPreset = countryPresets.find(
    (preset) => [...preset.codes].sort().join(',') === selectedKey,
  )?.key ?? ''
  const activePeriodPreset = periodPresets.find(
    (preset) => startYear === preset.startYear && endYear === preset.endYear,
  )?.key ?? ''

  return (
    <section className="preset-bar" aria-label={translate(language, 'presets.label')}>
      <label className="preset-select">
        <span>{translate(language, 'presets.countries')}</span>
        <select
          value={activeCountryPreset}
          onChange={(event) => {
            const preset = countryPresets.find(({ key }) => key === event.target.value)
            if (preset) onCountries(preset.codes)
          }}
        >
          <option value="">{translate(language, 'presets.chooseComparison')}</option>
          {countryPresets.map((preset) => (
            <option key={preset.key} value={preset.key}>{translate(language, preset.key)}</option>
          ))}
        </select>
      </label>
      <label className="preset-select">
        <span>{translate(language, 'presets.periods')}</span>
        <select
          value={activePeriodPreset}
          onChange={(event) => {
            const preset = periodPresets.find(({ key }) => key === event.target.value)
            if (preset) onPeriod(preset.startYear, preset.endYear)
          }}
        >
          <option value="">{translate(language, 'presets.choosePeriod')}</option>
          {periodPresets.map((preset) => (
            <option key={preset.key} value={preset.key}>{translate(language, preset.key)}</option>
          ))}
        </select>
      </label>
    </section>
  )
}
