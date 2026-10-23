import { useEffect, useMemo, useState } from 'react'
import './panorama.css'
import { CountrySelector } from './components/CountrySelector'
import { DataTable } from './components/DataTable'
import { SummaryCards } from './components/SummaryCards'
import { TimeSeriesChart } from './components/TimeSeriesChart'
import { WorldMap } from './components/WorldMap'
import { loadPanorama } from './lib/data'
import { buildCsv, downloadCsv } from './lib/exportCsv'
import { formatDate } from './lib/format'
import { getInitialLanguage, localizedCountryName, saveLanguage, translate } from './lib/i18n'
import { getInitialTheme, saveTheme } from './lib/theme'
import type { ComparisonMode, Language, PanoramaData, Theme, WorldMapData } from './types'

type LoadedState = { data: PanoramaData; map: WorldMapData }
const initialCountries = ['BRA', 'PER']

function PanoramaApp() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const [language, setLanguage] = useState<Language>(getInitialLanguage)
  const [loaded, setLoaded] = useState<LoadedState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<ComparisonMode>('growth')
  const [selectedCodes, setSelectedCodes] = useState(initialCountries)
  const [startYear, setStartYear] = useState(2000)
  const [endYear, setEndYear] = useState(2014)
  const [showNotice, setShowNotice] = useState(false)

  useEffect(() => {
    saveTheme(theme)
  }, [theme])

  useEffect(() => {
    saveLanguage(language)
  }, [language])

  useEffect(() => {
    loadPanorama()
      .then(setLoaded)
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'Falha desconhecida ao carregar os dados.')
      })
  }, [])

  const localizedCountries = useMemo(() => {
    if (!loaded) return []
    return loaded.data.countries.map((country) => ({
      ...country,
      name: localizedCountryName(language, country.code, country.name),
    }))
  }, [language, loaded])

  const selectedCountries = useMemo(() => {
    return selectedCodes
      .map((code) => localizedCountries.find((country) => country.code === code))
      .filter((country): country is PanoramaData['countries'][number] => Boolean(country))
  }, [localizedCountries, selectedCodes])

  if (error) {
    return (
      <main className="state-screen">
        <p className="eyebrow">Panorama</p>
        <h1>{translate(language, 'state.errorTitle')}</h1>
        <p>{error}</p>
        <p>{translate(language, 'state.errorHelp')}</p>
      </main>
    )
  }

  if (!loaded) {
    return (
      <main className="state-screen" aria-live="polite">
        <div className="loader" />
        <p>{translate(language, 'state.loading')}</p>
      </main>
    )
  }

  const { data, map } = loaded
  const availableCodes = new Set(
    data.countries
      .filter((country) => Object.values(country.availability).some(Boolean))
      .map(({ code }) => code),
  )

  const changeSelection = (code: string, additive: boolean) => {
    setShowNotice(false)
    if (!additive) {
      setSelectedCodes([code])
      return
    }

    setSelectedCodes((current) => {
      if (current.includes(code)) return current.filter((item) => item !== code)
      if (current.length >= 5) {
        setShowNotice(true)
        return current
      }
      return [...current, code]
    })
  }

  const toggleCountry = (code: string) => changeSelection(code, true)
  const exportSelection = () => {
    const csv = buildCsv(mode, selectedCountries, data.series, startYear, endYear, language)
    downloadCsv(csv, `panorama-${mode}-${startYear}-${endYear}.csv`)
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label={translate(language, 'brand.home')}>
          <span className="brand-mark" aria-hidden="true">P</span>
          <span>Panorama</span>
        </a>
        <nav aria-label={translate(language, 'nav.label')}>
          <a href="#comparador">{translate(language, 'nav.comparator')}</a>
          <a href="#dados">{translate(language, 'nav.data')}</a>
          <a href="#metodologia">{translate(language, 'nav.methodology')}</a>
        </nav>
        <div className="header-actions">
          <span className="source-pill">{translate(language, 'source.imf')}</span>
          <label className="language-picker" title={translate(language, 'language.label')}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3Z" /></svg>
            <span className="sr-only">{translate(language, 'language.label')}</span>
            <select
              value={language}
              aria-label={translate(language, 'language.label')}
              onChange={(event) => setLanguage(event.target.value as Language)}
            >
              <option value="pt-BR">PT-BR</option>
              <option value="en">EN</option>
              <option value="es">ES</option>
            </select>
          </label>
          <button
            className="theme-toggle"
            type="button"
            aria-label={translate(language, theme === 'light' ? 'theme.enableDark' : 'theme.enableLight')}
            title={translate(language, theme === 'light' ? 'theme.enableDark' : 'theme.enableLight')}
            onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}
          >
            {theme === 'light' ? (
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 15.2A8.5 8.5 0 0 1 8.8 3.8 8.5 8.5 0 1 0 20.2 15.2Z" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></svg>
            )}
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">{translate(language, 'hero.eyebrow')}</p>
            <h1>{translate(language, 'hero.titleFirst')}<br /><em>{translate(language, 'hero.titleSecond')}</em></h1>
            <p className="hero-description">
              {translate(language, 'hero.description')}
            </p>
          </div>
          <div className="hero-stat" aria-label={translate(language, 'hero.coverage')}>
            <span>{translate(language, 'hero.historicalBase')}</span>
            <strong>1800—2031</strong>
            <small>{translate(language, 'hero.sources')}</small>
          </div>
        </section>

        <section className="control-deck" id="comparador" aria-label={translate(language, 'controls.label')}>
          <div className="control-group indicator-control">
            <span className="control-label">{translate(language, 'controls.indicator')}</span>
            <div className="segmented-control">
              <button type="button" aria-pressed={mode === 'growth'} onClick={() => setMode('growth')}>
                {translate(language, 'controls.growth')}
              </button>
              <button type="button" aria-pressed={mode === 'debt'} onClick={() => setMode('debt')}>
                {translate(language, 'controls.debt')}
              </button>
              <button type="button" aria-pressed={mode === 'gdpPerCapita'} onClick={() => setMode('gdpPerCapita')}>
                {translate(language, 'controls.gdpPerCapita')}
              </button>
              <button type="button" aria-pressed={mode === 'consumptionPerCapita'} onClick={() => setMode('consumptionPerCapita')}>
                {translate(language, 'controls.consumptionPerCapita')}
              </button>
              <button type="button" aria-pressed={mode === 'both'} onClick={() => setMode('both')}>
                {translate(language, 'controls.both')}
              </button>
            </div>
          </div>

          <div className="control-group period-control">
            <span className="control-label">{translate(language, 'controls.period')}</span>
            <div className="period-inputs">
              <label>
                <span>{translate(language, 'controls.from')}</span>
                <input type="number" min="1800" max={endYear} value={startYear} onChange={(event) => setStartYear(Math.min(Number(event.target.value), endYear))} />
              </label>
              <span className="period-arrow">→</span>
              <label>
                <span>{translate(language, 'controls.to')}</span>
                <input type="number" min={startYear} max="2031" value={endYear} onChange={(event) => setEndYear(Math.max(Number(event.target.value), startYear))} />
              </label>
            </div>
          </div>

          <button className="export-button" type="button" onClick={exportSelection} disabled={!selectedCountries.length}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 15v4h14v-4" /></svg>
            {translate(language, 'controls.export')}
          </button>
        </section>

        <CountrySelector countries={localizedCountries} selectedCodes={selectedCodes} onToggle={toggleCountry} onRemove={toggleCountry} language={language} />
        {showNotice && <p className="notice" role="status">{translate(language, 'notice.maxCountries')}</p>}

        <div className="visual-grid">
          <WorldMap map={map} availableCodes={availableCodes} selectedCodes={selectedCodes} onSelect={changeSelection} language={language} />
          <TimeSeriesChart countries={selectedCountries} mode={mode} series={data.series} startYear={startYear} endYear={endYear} theme={theme} language={language} />
        </div>

        {selectedCountries.length > 0 ? (
          <>
            <SummaryCards countries={selectedCountries} mode={mode} series={data.series} startYear={startYear} endYear={endYear} language={language} />
            <div id="dados">
              <DataTable countries={selectedCountries} mode={mode} series={data.series} startYear={startYear} endYear={endYear} language={language} />
            </div>
          </>
        ) : (
          <section className="empty-selection">
            <h2>{translate(language, 'empty.title')}</h2>
            <p>{translate(language, 'empty.text')}</p>
          </section>
        )}

        <section className="methodology" id="metodologia">
          <div>
            <p className="eyebrow">{translate(language, 'methodology.eyebrow')}</p>
            <h2>{translate(language, 'methodology.title')}</h2>
          </div>
          <div className="methodology-copy">
            <p>{translate(language, 'methodology.sourceLead')}</p>
            <p>{translate(language, 'methodology.note')}</p>
            <ul>
              {data.meta.sources.map((source) => (
                <li key={source.id}>
                  <a href={source.url} target="_blank" rel="noreferrer">{source.label}</a>
                  <span>{translate(language, 'methodology.updated', { date: source.lastModified.split(' ')[0] })}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer>
        <span>Panorama</span>
        <p>{translate(language, 'footer.prepared', { date: formatDate(data.meta.generatedAt, language) })}</p>
      </footer>
    </div>
  )
}

export default PanoramaApp
