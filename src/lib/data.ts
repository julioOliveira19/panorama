import { panoramaDataSchema } from '../types'
import type { PanoramaData, WorldMapData } from '../types'

function assetUrl(filename: string) {
  return `${import.meta.env.BASE_URL}data/${filename}`
}

async function loadJson(filename: string) {
  const response = await fetch(assetUrl(filename))
  if (!response.ok) {
    throw new Error(`Não foi possível carregar ${filename} (HTTP ${response.status}).`)
  }
  return response.json() as Promise<unknown>
}

export async function loadPanorama(): Promise<{
  data: PanoramaData
  map: WorldMapData
}> {
  const [rawData, rawMap] = await Promise.all([
    loadJson('panorama-data.json'),
    loadJson('world-map.json'),
  ])

  return {
    data: panoramaDataSchema.parse(rawData),
    map: rawMap as WorldMapData,
  }
}
