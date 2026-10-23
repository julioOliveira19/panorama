import { execFile } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import countries from 'i18n-iso-countries'
import { feature } from 'topojson-client'

const require = createRequire(import.meta.url)
const ptLocale = require('i18n-iso-countries/langs/pt.json')
const worldAtlas = require('world-atlas/countries-110m.json')
countries.registerLocale(ptLocale)

const execFileAsync = promisify(execFile)
const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const cacheDirectory = join(projectRoot, '.cache', 'imf')
const rawDirectory = join(projectRoot, 'data', 'raw')
const publicDataDirectory = join(projectRoot, 'public', 'data')
const edgeScript = join(projectRoot, 'scripts', 'fetch-edge.ps1')

const endpoints = {
  countries: 'https://www.imf.org/external/datamapper/api/v2/countries',
  fppGrowth: 'https://www.imf.org/external/datamapper/api/v2/rgc',
  fppDebt: 'https://www.imf.org/external/datamapper/api/v2/d',
  weoGrowth: 'https://www.imf.org/external/datamapper/api/v2/NGDP_RPCH',
  weoDebt: 'https://www.imf.org/external/datamapper/api/v2/GGXWDG_NGDP',
  worldBankGdpPerCapita: 'https://api.worldbank.org/v2/country/all/indicator/NY.GDP.PCAP.PP.KD?format=json&per_page=20000',
  worldBankConsumptionPerCapita: 'https://api.worldbank.org/v2/country/all/indicator/NE.CON.PCAP.PP.KD?format=json&per_page=20000',
}

const indicatorConfiguration = {
  growth: { fpp: 'rgc', weo: 'NGDP_RPCH' },
  debt: { fpp: 'd', weo: 'GGXWDG_NGDP' },
}

async function fetchWithHttp(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Panorama data updater (educational project)',
    },
    signal: AbortSignal.timeout(30_000),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  return response.json()
}

function decodeHtml(value) {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
}

function parseEdgeDocument(html) {
  const match = html.match(/<pre>([\s\S]*?)<\/pre>/i)
  if (!match) {
    throw new Error('O Edge não retornou um documento JSON da fonte de dados.')
  }
  return JSON.parse(decodeHtml(match[1]))
}

async function fetchWithEdge(key, url) {
  if (process.platform !== 'win32') {
    throw new Error('Fallback com Edge disponível apenas no Windows.')
  }

  const htmlPath = join(cacheDirectory, `${key}.html`)
  const profilePath = join(cacheDirectory, `edge-${key}`)
  await execFileAsync('powershell.exe', [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    edgeScript,
    '-Url',
    url,
    '-OutputPath',
    htmlPath,
    '-ProfilePath',
    profilePath,
  ], { windowsHide: true, maxBuffer: 8 * 1024 * 1024 })

  const html = await readFile(htmlPath, 'utf8')
  return parseEdgeDocument(html)
}

async function fetchDataset(key, url) {
  try {
    const data = await fetchWithHttp(url)
    console.log(`✓ ${key}: API direta`)
    return data
  } catch (error) {
    console.warn(`! ${key}: API direta indisponível (${error.message}); tentando Edge.`)
    const data = await fetchWithEdge(key, url)
    console.log(`✓ ${key}: Edge`)
    return data
  }
}

function getIndicator(payload, indicatorCode) {
  const metadata = payload.indicators?.[indicatorCode]
  const values = payload.values?.[indicatorCode]
  if (!metadata || !values) {
    throw new Error(`Resposta inválida: indicador ${indicatorCode} ausente.`)
  }
  return { metadata, values }
}

function normalizedName(code, fallback) {
  const aliases = { UVK: 'XKX' }
  const isoCode = aliases[code] ?? code
  return countries.getName(isoCode, 'pt', { select: 'official' }) ?? fallback ?? code
}

function entriesForCountry(values, code, source, projectionYear) {
  const yearlyValues = values[code] ?? {}
  return Object.entries(yearlyValues)
    .map(([year, value]) => {
      const numericYear = Number(year)
      let status = 'observation'
      if (source === 'WEO' && projectionYear) {
        if (numericYear >= projectionYear) status = 'projection'
        else if (numericYear === projectionYear - 1) status = 'estimate'
      }
      return {
        year: numericYear,
        value: Number(value),
        source,
        status,
      }
    })
    .filter((entry) => Number.isFinite(entry.year) && Number.isFinite(entry.value))
    .sort((a, b) => a.year - b.year)
}

function combineSources(fppValues, weoValues, projectionYear) {
  const codes = new Set([...Object.keys(fppValues), ...Object.keys(weoValues)])
  const result = {}

  for (const code of codes) {
    const historical = entriesForCountry(fppValues, code, 'FPP')
    const recent = entriesForCountry(weoValues, code, 'WEO', projectionYear)
    const historicalYears = new Set(historical.map(({ year }) => year))
    const lastHistoricalYear = historical.at(-1)?.year ?? -Infinity
    const supplements = recent.filter(({ year }) => (
      !historicalYears.has(year) && (historical.length === 0 || year > lastHistoricalYear)
    ))
    const combined = [...historical, ...supplements].sort((a, b) => a.year - b.year)
    if (combined.length > 0) result[code] = combined
  }

  return result
}

function worldBankSeries(payload, allowedCodes) {
  if (!Array.isArray(payload) || !Array.isArray(payload[1])) {
    throw new Error('Resposta inválida da API do Banco Mundial.')
  }

  const result = {}
  for (const row of payload[1]) {
    if (row.value == null) continue
    const code = row.countryiso3code
    const year = Number(row.date)
    const value = Number(row.value)
    if (!allowedCodes.has(code) || !Number.isFinite(year) || !Number.isFinite(value)) continue
    result[code] ??= []
    result[code].push({
      year,
      value,
      source: 'WB',
      status: 'published',
    })
  }

  for (const points of Object.values(result)) {
    points.sort((a, b) => a.year - b.year)
  }
  return result
}

function availability(points) {
  if (!points?.length) return null
  return {
    minYear: points[0].year,
    maxYear: points.at(-1).year,
    count: points.length,
  }
}

function buildWorldMap() {
  const collection = feature(worldAtlas, worldAtlas.objects.countries)
  const aliases = { '383': 'XKX' }
  return {
    type: 'FeatureCollection',
    features: collection.features
      .map((item) => {
        const numericCode = String(item.id).padStart(3, '0')
        const code = aliases[numericCode] ?? countries.numericToAlpha3(numericCode)
        if (!code) return null
        return {
          type: 'Feature',
          id: code,
          properties: {
            code,
            name: normalizedName(code, item.properties?.name),
          },
          geometry: item.geometry,
        }
      })
      .filter(Boolean),
  }
}

async function main() {
  await mkdir(cacheDirectory, { recursive: true })
  await mkdir(rawDirectory, { recursive: true })
  await mkdir(publicDataDirectory, { recursive: true })

  const payloads = {}
  for (const [key, url] of Object.entries(endpoints)) {
    payloads[key] = await fetchDataset(key, url)
    await writeFile(join(rawDirectory, `${key}.json`), `${JSON.stringify(payloads[key])}\n`)
  }

  const fppGrowth = getIndicator(payloads.fppGrowth, indicatorConfiguration.growth.fpp)
  const fppDebt = getIndicator(payloads.fppDebt, indicatorConfiguration.debt.fpp)
  const weoGrowth = getIndicator(payloads.weoGrowth, indicatorConfiguration.growth.weo)
  const weoDebt = getIndicator(payloads.weoDebt, indicatorConfiguration.debt.weo)

  const growth = combineSources(
    fppGrowth.values,
    weoGrowth.values,
    weoGrowth.metadata['projection-year'],
  )
  const debt = combineSources(
    fppDebt.values,
    weoDebt.values,
    weoDebt.metadata['projection-year'],
  )
  const baseCountryCodes = new Set([...Object.keys(growth), ...Object.keys(debt)])
  const series = {
    growth,
    debt,
    gdpPerCapita: worldBankSeries(payloads.worldBankGdpPerCapita, baseCountryCodes),
    consumptionPerCapita: worldBankSeries(
      payloads.worldBankConsumptionPerCapita,
      baseCountryCodes,
    ),
  }

  const allCodes = new Set([
    ...Object.keys(series.growth),
    ...Object.keys(series.debt),
    ...Object.keys(series.gdpPerCapita),
    ...Object.keys(series.consumptionPerCapita),
  ])
  const countryCatalog = payloads.countries.countries ?? {}
  const countryList = [...allCodes]
    .map((code) => ({
      code,
      name: normalizedName(code, countryCatalog[code]?.label),
      availability: {
        growth: availability(series.growth[code]),
        debt: availability(series.debt[code]),
        gdpPerCapita: availability(series.gdpPerCapita[code]),
        consumptionPerCapita: availability(series.consumptionPerCapita[code]),
      },
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

  const output = {
    meta: {
      generatedAt: new Date().toISOString(),
      methodology: 'FPP histórico; WEO apenas após o último ano FPP disponível por país e indicador; WDI para PIB e consumo per capita em PPC constante.',
      indicators: {
        growth: {
          label: 'Crescimento real anual do PIB',
          unit: '%',
          fppCode: indicatorConfiguration.growth.fpp,
          weoCode: indicatorConfiguration.growth.weo,
        },
        debt: {
          label: 'Dívida pública bruta',
          unit: '% do PIB',
          fppCode: indicatorConfiguration.debt.fpp,
          weoCode: indicatorConfiguration.debt.weo,
        },
        gdpPerCapita: {
          label: 'PIB per capita em PPC, preços constantes',
          unit: 'dólares internacionais constantes de 2021 por habitante',
          worldBankCode: 'NY.GDP.PCAP.PP.KD',
        },
        consumptionPerCapita: {
          label: 'Consumo das famílias per capita em PPC, preços constantes',
          unit: 'dólares internacionais constantes de 2021 por habitante',
          worldBankCode: 'NE.CON.PCAP.PP.KD',
        },
      },
      sources: [
        {
          id: 'FPP',
          label: fppGrowth.metadata.source,
          url: 'https://www.imf.org/external/datamapper/datasets/FPP',
          lastModified: fppGrowth.metadata['last-modified'],
        },
        {
          id: 'WEO',
          label: weoGrowth.metadata.source,
          url: 'https://data.imf.org/Datasets/WEO',
          lastModified: weoGrowth.metadata['last-modified'],
          projectionYear: weoGrowth.metadata['projection-year'],
        },
        {
          id: 'WB',
          label: 'World Development Indicators — Banco Mundial',
          url: 'https://data.worldbank.org/',
          lastModified: payloads.worldBankGdpPerCapita[0]?.lastupdated ?? new Date().toISOString(),
        },
      ],
    },
    countries: countryList,
    series,
  }

  await writeFile(
    join(publicDataDirectory, 'panorama-data.json'),
    `${JSON.stringify(output)}\n`,
  )
  await writeFile(
    join(publicDataDirectory, 'world-map.json'),
    `${JSON.stringify(buildWorldMap())}\n`,
  )

  await rm(cacheDirectory, { recursive: true, force: true })
  console.log(`✓ ${countryList.length} países normalizados`)
  console.log('✓ public/data/panorama-data.json')
  console.log('✓ public/data/world-map.json')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
