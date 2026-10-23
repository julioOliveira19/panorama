import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { WorldMapData } from '../types'
import { countryColors } from '../types'

const MAP_WIDTH = 920
const MAP_HEIGHT = 460
const MAX_ZOOM = 6

type MapTransform = {
  scale: number
  x: number
  y: number
}

function clampTransform(transform: MapTransform): MapTransform {
  const minX = MAP_WIDTH * (1 - transform.scale)
  const minY = MAP_HEIGHT * (1 - transform.scale)
  return {
    scale: transform.scale,
    x: Math.min(0, Math.max(minX, transform.x)),
    y: Math.min(0, Math.max(minY, transform.y)),
  }
}

type WorldMapProps = {
  map: WorldMapData
  availableCodes: Set<string>
  selectedCodes: string[]
  onSelect: (code: string, additive: boolean) => void
}

export function WorldMap({ map, availableCodes, selectedCodes, onSelect }: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [transform, setTransform] = useState<MapTransform>({ scale: 1, x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{
    pointerId: number
    clientX: number
    clientY: number
    x: number
    y: number
    moved: boolean
  } | null>(null)
  const suppressClickUntil = useRef(0)
  const paths = useMemo(() => {
    const projection = geoNaturalEarth1().fitExtent([[12, 12], [908, 448]], map)
    const path = geoPath(projection)
    return map.features.map((feature) => ({
      feature,
      path: path(feature) ?? '',
    }))
  }, [map])

  const zoomBy = (factor: number, centerX = MAP_WIDTH / 2, centerY = MAP_HEIGHT / 2) => {
    setTransform((current) => {
      const scale = Math.min(MAX_ZOOM, Math.max(1, current.scale * factor))
      const ratio = scale / current.scale
      return clampTransform({
        scale,
        x: centerX - (centerX - current.x) * ratio,
        y: centerY - (centerY - current.y) * ratio,
      })
    })
  }

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const bounds = svg.getBoundingClientRect()
      const centerX = (event.clientX - bounds.left) * MAP_WIDTH / bounds.width
      const centerY = (event.clientY - bounds.top) * MAP_HEIGHT / bounds.height
      const factor = event.deltaY < 0 ? 1.2 : 1 / 1.2
      setTransform((current) => {
        const scale = Math.min(MAX_ZOOM, Math.max(1, current.scale * factor))
        const ratio = scale / current.scale
        return clampTransform({
          scale,
          x: centerX - (centerX - current.x) * ratio,
          y: centerY - (centerY - current.y) * ratio,
        })
      })
    }

    svg.addEventListener('wheel', handleWheel, { passive: false })
    return () => svg.removeEventListener('wheel', handleWheel)
  }, [])

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.button !== 0 || transform.scale === 1) return
    dragRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      x: transform.x,
      y: transform.y,
      moved: false,
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const dx = (event.clientX - drag.clientX) * MAP_WIDTH / bounds.width
    const dy = (event.clientY - drag.clientY) * MAP_HEIGHT / bounds.height
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) <= 3) return
    if (!drag.moved) {
      drag.moved = true
      event.currentTarget.setPointerCapture(event.pointerId)
      setIsDragging(true)
    }
    suppressClickUntil.current = performance.now() + 250
    setTransform((current) => clampTransform({
      scale: current.scale,
      x: drag.x + dx,
      y: drag.y + dy,
    }))
  }

  const finishDrag = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return
    const dragged = dragRef.current.moved
    dragRef.current = null
    setIsDragging(false)
    if (dragged) suppressClickUntil.current = performance.now() + 250
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <section className="panel map-panel" aria-labelledby="map-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Seleção geográfica</p>
          <h2 id="map-title">Mapa-múndi</h2>
        </div>
        <p className="panel-help">Clique para escolher. Use +/− ou a roda para aproximar; arraste quando ampliado.</p>
      </div>

      <div className="map-frame">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          role="img"
          aria-label={`Mapa interativo de países, zoom em ${Math.round(transform.scale * 100)}%`}
          className={`map-viewport ${transform.scale > 1 ? 'is-zoomed' : ''} ${isDragging ? 'is-dragging' : ''}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
        >
          <rect width="920" height="460" rx="18" className="map-ocean" />
          <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}>
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
                    if (performance.now() < suppressClickUntil.current) return
                    if (isAvailable) onSelect(code, isSelected || event.ctrlKey || event.metaKey)
                  }}
                  onKeyDown={(event) => {
                    if (isAvailable && (event.key === 'Enter' || event.key === ' ')) {
                      event.preventDefault()
                      onSelect(code, isSelected || event.ctrlKey || event.metaKey)
                    }
                  }}
                >
                  <title>{feature.properties.name}</title>
                </path>
              )
            })}
          </g>
        </svg>
        <div className="map-controls" aria-label="Controles de zoom do mapa">
          <button type="button" onClick={() => zoomBy(1.5)} disabled={transform.scale >= MAX_ZOOM} aria-label="Aumentar zoom">+</button>
          <button type="button" onClick={() => zoomBy(1 / 1.5)} disabled={transform.scale <= 1} aria-label="Diminuir zoom">−</button>
          <button
            type="button"
            className="map-reset"
            onClick={() => setTransform({ scale: 1, x: 0, y: 0 })}
            disabled={transform.scale === 1}
            aria-label="Redefinir zoom"
          >
            {Math.round(transform.scale * 100)}%
          </button>
        </div>
      </div>
    </section>
  )
}
