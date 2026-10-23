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
import type { IndicatorKey, PanoramaData, WorldMapData } from './types'

type LoadedState = { data: PanoramaData; map: WorldMapData }
const initialCountries = ['BRA', 'PER']

function PanoramaApp() {
  const [loaded, setLoaded] = useState<LoadedState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [indicator, setIndicator] = useState<IndicatorKey>('growth')
  const [selectedCodes, setSelectedCodes] = useState(initialCountries)
  const [startYear, setStartYear] = useState(2000)
  const [endYear, setEndYear] = useState(2014)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    loadPanorama()
      .then(setLoaded)
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'Falha desconhecida ao carregar os dados.')
      })
  }, [])

  const selectedCountries = useMemo(() => {
    if (!loaded) return []
    return selectedCodes
      .map((code) => loaded.data.countries.find((country) => country.code === code))
      .filter((country): country is PanoramaData['countries'][number] => Boolean(country))
  }, [loaded, selectedCodes])

  if (error) {
    return (
      <main className="state-screen">
        <p className="eyebrow">Panorama</p>
        <h1>Não foi possível abrir os dados.</h1>
        <p>{error}</p>
        <p>Execute <code>npm run data:update</code> e tente novamente.</p>
      </main>
    )
  }

  if (!loaded) {
    return (
      <main className="state-screen" aria-live="polite">
        <div className="loader" />
        <p>Preparando o panorama mundial…</p>
      </main>
    )
  }

  const { data, map } = loaded
  const series = data.series[indicator]
  const availableCodes = new Set(
    data.countries
      .filter((country) => country.availability.growth || country.availability.debt)
      .map(({ code }) => code),
  )

  const changeSelection = (code: string, additive: boolean) => {
    setNotice(null)
    if (!additive) {
      setSelectedCodes([code])
      return
    }

    setSelectedCodes((current) => {
      if (current.includes(code)) return current.filter((item) => item !== code)
      if (current.length >= 5) {
        setNotice('O comparador aceita até cinco países por vez.')
        return current
      }
      return [...current, code]
    })
  }

  const toggleCountry = (code: string) => changeSelection(code, true)
  const exportSelection = () => {
    const csv = buildCsv(indicator, selectedCountries, series, startYear, endYear)
    downloadCsv(csv, `panorama-${indicator}-${startYear}-${endYear}.csv`)
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Panorama, início">
          <span className="brand-mark" aria-hidden="true">P</span>
          <span>Panorama</span>
        </a>
        <nav aria-label="Navegação principal">
          <a href="#comparador">Comparador</a>
          <a href="#dados">Dados</a>
          <a href="#metodologia">Metodologia</a>
        </nav>
        <span className="source-pill">Dados do FMI</span>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Economia sem fronteiras</p>
            <h1>Compare países.<br /><em>Enxergue o tempo.</em></h1>
            <p className="hero-description">
              Crescimento real do PIB e dívida pública em uma leitura histórica,
              comparável e transparente.
            </p>
          </div>
          <div className="hero-stat" aria-label="Cobertura da base">
            <span>Base histórica</span>
            <strong>1800—2031</strong>
            <small>FPP histórico + WEO recente</small>
          </div>
        </section>

        <section className="control-deck" id="comparador" aria-label="Controles da comparação">
          <div className="control-group indicator-control">
            <span className="control-label">Indicador</span>
            <div className="segmented-control">
              <button type="button" aria-pressed={indicator === 'growth'} onClick={() => setIndicator('growth')}>
                Crescimento do PIB
              </button>
              <button type="button" aria-pressed={indicator === 'debt'} onClick={() => setIndicator('debt')}>
                Dívida pública
              </button>
            </div>
          </div>

          <div className="control-group period-control">
            <span className="control-label">Período</span>
            <div className="period-inputs">
              <label>
                <span>De</span>
                <input type="number" min="1800" max={endYear} value={startYear} onChange={(event) => setStartYear(Math.min(Number(event.target.value), endYear))} />
              </label>
              <span className="period-arrow">→</span>
              <label>
                <span>Até</span>
                <input type="number" min={startYear} max="2031" value={endYear} onChange={(event) => setEndYear(Math.max(Number(event.target.value), startYear))} />
              </label>
            </div>
          </div>

          <button className="export-button" type="button" onClick={exportSelection} disabled={!selectedCountries.length}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 15v4h14v-4" /></svg>
            Exportar CSV
          </button>
        </section>

        <CountrySelector countries={data.countries} selectedCodes={selectedCodes} onToggle={toggleCountry} onRemove={toggleCountry} />
        {notice && <p className="notice" role="status">{notice}</p>}

        <div className="visual-grid">
          <WorldMap map={map} availableCodes={availableCodes} selectedCodes={selectedCodes} onSelect={changeSelection} />
          <TimeSeriesChart countries={selectedCountries} indicator={indicator} series={series} startYear={startYear} endYear={endYear} />
        </div>

        {selectedCountries.length > 0 ? (
          <>
            <SummaryCards countries={selectedCountries} indicator={indicator} series={series} startYear={startYear} endYear={endYear} />
            <div id="dados">
              <DataTable countries={selectedCountries} series={series} startYear={startYear} endYear={endYear} />
            </div>
          </>
        ) : (
          <section className="empty-selection">
            <h2>Selecione pelo menos um país</h2>
            <p>Use o mapa ou a busca para começar a comparação.</p>
          </section>
        )}

        <section className="methodology" id="metodologia">
          <div>
            <p className="eyebrow">Transparência</p>
            <h2>Fontes e metodologia</h2>
          </div>
          <div className="methodology-copy">
            <p>{data.meta.methodology}</p>
            <p>
              A média de crescimento é aritmética e usa apenas anos disponíveis. O acumulado é composto.
              Para dívida, a variação é exibida em pontos percentuais. Lacunas permanecem vazias e
              projeções aparecem tracejadas.
            </p>
            <ul>
              {data.meta.sources.map((source) => (
                <li key={source.id}>
                  <a href={source.url} target="_blank" rel="noreferrer">{source.label}</a>
                  <span>Atualização da fonte: {source.lastModified.split(' ')[0]}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer>
        <span>Panorama</span>
        <p>Dados preparados em {formatDate(data.meta.generatedAt)} · Sem inferência causal.</p>
      </footer>
    </div>
  )
}

export default PanoramaApp
