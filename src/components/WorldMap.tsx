import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { useMemo } from 'react'
import type { WorldMapData } from '../types'
import { countryColors } from '../types'

type WorldMapProps = {
  map: WorldMapData
  availableCodes: Set<string>
  selectedCodes: string[]
  onSelect: (code: string, additive: boolean) => void
}

export function WorldMap({ map, availableCodes, selectedCodes, onSelect }: WorldMapProps) {
  const paths = useMemo(() => {
    const projection = geoNaturalEarth1().fitExtent([[12, 12], [908, 448]], map)
    const path = geoPath(projection)
    return map.features.map((feature) => ({
      feature,
      path: path(feature) ?? '',
    }))
  }, [map])

  return (
    <section className="panel map-panel" aria-labelledby="map-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Seleção geográfica</p>
          <h2 id="map-title">Mapa-múndi</h2>
        </div>
        <p className="panel-help">Clique para escolher. Ctrl+clique adiciona ou remove.</p>
      </div>

      <div className="map-frame">
        <svg viewBox="0 0 920 460" role="img" aria-label="Mapa interativo de países">
          <rect width="920" height="460" rx="18" className="map-ocean" />
          <g>
            {paths.map(({ feature, path }) => {
              const code = feature.properties.code
              const selectedIndex = selectedCodes.indexOf(code)
              const isSelected = selectedIndex >= 0
              const isAvailable = availableCodes.has(code)
              return (
                <path
                  key={code}
                  d={path}
                  className={`map-country ${isAvailable ? 'is-available' : ''} ${isSelected ? 'is-selected' : ''}`}
                  style={isSelected ? { fill: countryColors[selectedIndex] } : undefined}
                  role={isAvailable ? 'button' : undefined}
                  tabIndex={isAvailable ? 0 : -1}
                  aria-label={`${feature.properties.name}${isSelected ? ', selecionado' : ''}`}
                  aria-disabled={!isAvailable}
                  onClick={(event) => {
                    if (isAvailable) onSelect(code, event.ctrlKey || event.metaKey)
                  }}
                  onKeyDown={(event) => {
                    if (isAvailable && (event.key === 'Enter' || event.key === ' ')) {
                      event.preventDefault()
                      onSelect(code, event.ctrlKey || event.metaKey)
                    }
                  }}
                >
                  <title>{feature.properties.name}</title>
                </path>
              )
            })}
          </g>
        </svg>
      </div>
    </section>
  )
}
