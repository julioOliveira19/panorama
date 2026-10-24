import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { formatPerCapita, formatSigned, formatValue, statusLabel } from '../lib/format'
import { localizedCountryName, translate } from '../lib/i18n'
import { pinchTransform } from '../lib/mapGesture'
import { buildMapColorScale } from '../lib/mapScale'
import type { ComparisonMode, IndicatorKey, Language, PanoramaData, WorldMapData } from '../types'
import { countryColor } from '../types'

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
  mode: ComparisonMode
  series: PanoramaData['series']
  year: number
  language: Language
}

export function WorldMap({ map, availableCodes, selectedCodes, onSelect, mode, series, year, language }: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [transform, setTransform] = useState<MapTransform>({ scale: 1, x: 0, y: 0 })
  const transformRef = useRef(transform)
  const [isDragging, setIsDragging] = useState(false)
  const [bothLayer, setBothLayer] = useState<IndicatorKey>('growth')
  const dragRef = useRef<{
    pointerId: number
    clientX: number
    clientY: number
    x: number
    y: number
    moved: boolean
  } | null>(null)
  const touchPointsRef = useRef(new Map<number, { clientX: number; clientY: number }>())
  const pinchRef = useRef<{
    distance: number
    midpoint: { x: number; y: number }
    transform: MapTransform
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
  const mapIndicator: IndicatorKey = mode === 'both' ? bothLayer : mode
  const mapPoints = useMemo(() => {
    const points = new Map<string, PanoramaData['series'][IndicatorKey][string][number]>()
    for (const feature of map.features) {
      const code = feature.properties.code
      const point = (series[mapIndicator][code] ?? []).find((item) => item.year === year)
      if (point) points.set(code, point)
    }
    return points
  }, [map.features, mapIndicator, series, year])
  const colorScale = useMemo(
    () => buildMapColorScale([...mapPoints.values()].map(({ value }) => value), mapIndicator),
    [mapIndicator, mapPoints],
  )
  const indicatorLabel = translate(
    language,
    mapIndicator === 'growth'
      ? 'controls.growth'
      : mapIndicator === 'debt'
        ? 'controls.debt'
        : mapIndicator === 'gdpPerCapita'
          ? 'controls.gdpPerCapita'
          : 'controls.consumptionPerCapita',
  )
  const formatMapValue = (value: number) => mapIndicator === 'gdpPerCapita' || mapIndicator === 'consumptionPerCapita'
    ? formatPerCapita(value, language)
    : formatValue(value, language)
  const mapUnit = mapIndicator === 'growth'
    ? translate(language, 'chart.growthUnit')
    : mapIndicator === 'debt'
      ? translate(language, 'unit.debt')
      : translate(language, 'unit.perCapita')
  const legendValue = (value: number) => mapIndicator === 'growth'
    ? `${formatSigned(value, language)}%`
    : mapIndicator === 'debt'
      ? `${formatValue(value, language)}%`
      : formatPerCapita(value, language)
  const legendLabels = mapIndicator === 'growth'
    ? ['map.scaleDecline', 'map.scaleStable', 'map.scaleGrowth'] as const
    : ['map.scaleLower', 'map.scaleMiddle', 'map.scaleHigher'] as const

  const zoomBy = (factor: number, centerX = MAP_WIDTH / 2, centerY = MAP_HEIGHT / 2) => {
    setTransform((current) => {
      const scale = Math.min(MAX_ZOOM, Math.max(1, current.scale * factor))
      const ratio = scale / current.scale
      const next = clampTransform({
        scale,
        x: centerX - (centerX - current.x) * ratio,
        y: centerY - (centerY - current.y) * ratio,
      })
      transformRef.current = next
      return next
    })
  }

  const clientToMapPoint = (svg: SVGSVGElement, clientX: number, clientY: number) => {
    const bounds = svg.getBoundingClientRect()
    return {
      x: (clientX - bounds.left) * MAP_WIDTH / bounds.width,
      y: (clientY - bounds.top) * MAP_HEIGHT / bounds.height,
    }
  }

  const beginPinch = (svg: SVGSVGElement) => {
    const points = [...touchPointsRef.current.values()]
    if (points.length < 2) return
    const [first, second] = points
    const midpoint = clientToMapPoint(
      svg,
      (first.clientX + second.clientX) / 2,
      (first.clientY + second.clientY) / 2,
    )
    pinchRef.current = {
      distance: Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY),
      midpoint,
      transform: transformRef.current,
    }
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
        const next = clampTransform({
          scale,
          x: centerX - (centerX - current.x) * ratio,
          y: centerY - (centerY - current.y) * ratio,
        })
        transformRef.current = next
        return next
      })
    }

    svg.addEventListener('wheel', handleWheel, { passive: false })
    return () => svg.removeEventListener('wheel', handleWheel)
  }, [])

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.pointerType === 'touch') {
      touchPointsRef.current.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY })
      if (touchPointsRef.current.size >= 2) {
        dragRef.current = null
        for (const pointerId of touchPointsRef.current.keys()) {
          if (!event.currentTarget.hasPointerCapture(pointerId)) event.currentTarget.setPointerCapture(pointerId)
        }
        beginPinch(event.currentTarget)
        setIsDragging(true)
        suppressClickUntil.current = performance.now() + 300
        return
      }
    }

    const currentTransform = transformRef.current
    if (event.button !== 0 || currentTransform.scale === 1) return
    dragRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      x: currentTransform.x,
      y: currentTransform.y,
      moved: false,
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.pointerType === 'touch' && touchPointsRef.current.has(event.pointerId)) {
      touchPointsRef.current.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY })
      if (touchPointsRef.current.size >= 2) {
        event.preventDefault()
        if (!pinchRef.current) beginPinch(event.currentTarget)
        const pinch = pinchRef.current
        const points = [...touchPointsRef.current.values()]
        if (!pinch || points.length < 2) return
        const [first, second] = points
        const midpoint = clientToMapPoint(
          event.currentTarget,
          (first.clientX + second.clientX) / 2,
          (first.clientY + second.clientY) / 2,
        )
        const distance = Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY)
        const next = clampTransform(pinchTransform(
          pinch.transform,
          pinch.distance,
          pinch.midpoint,
          distance,
          midpoint,
          1,
          MAX_ZOOM,
        ))
        transformRef.current = next
        setTransform(next)
        suppressClickUntil.current = performance.now() + 300
        return
      }
    }

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
    const currentTransform = transformRef.current
    const next = clampTransform({
      scale: currentTransform.scale,
      x: drag.x + dx,
      y: drag.y + dy,
    })
    transformRef.current = next
    setTransform(next)
  }

  const finishDrag = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.pointerType === 'touch') {
      touchPointsRef.current.delete(event.pointerId)
      pinchRef.current = null
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      const remaining = [...touchPointsRef.current.entries()]
      if (remaining.length === 1 && transformRef.current.scale > 1) {
        const [pointerId, point] = remaining[0]
        dragRef.current = {
          pointerId,
          clientX: point.clientX,
          clientY: point.clientY,
          x: transformRef.current.x,
          y: transformRef.current.y,
          moved: true,
        }
      } else {
        dragRef.current = null
        setIsDragging(false)
      }
      suppressClickUntil.current = performance.now() + 300
      return
    }

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
          <p className="eyebrow">{translate(language, 'map.eyebrow')}</p>
          <h2 id="map-title">{translate(language, 'map.title')}</h2>
        </div>
        <div className="map-heading-side">
          <p className="panel-help">{translate(language, 'map.help')}</p>
          {mode === 'both' && (
            <div className="map-layer-switch" aria-label={translate(language, 'map.layerLabel')}>
              <button type="button" aria-pressed={bothLayer === 'growth'} onClick={() => setBothLayer('growth')}>
                {translate(language, 'chart.gdp')}
              </button>
              <button type="button" aria-pressed={bothLayer === 'debt'} onClick={() => setBothLayer('debt')}>
                {translate(language, 'chart.debt')}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="map-frame">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          role="img"
          aria-label={translate(language, 'map.aria', { zoom: Math.round(transform.scale * 100) })}
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
              const countryName = localizedCountryName(language, code, feature.properties.name)
              const point = mapPoints.get(code)
              const pointTitle = point
                ? translate(language, 'map.value', {
                    country: countryName,
                    value: `${formatMapValue(point.value)} ${mapUnit}`,
                    year: point.year,
                    source: point.source,
                    status: statusLabel(point.status, language),
                  })
                : countryName
              return (
                <path
                  key={code}
                  d={path}
                  className={`map-country ${isAvailable ? 'is-available' : ''} ${point ? 'has-value' : ''} ${isSelected ? 'is-selected' : ''}`}
                  style={{
                    fill: point ? colorScale.color(point.value) : undefined,
                    stroke: isSelected ? countryColor(selectedIndex) : undefined,
                    strokeWidth: isSelected ? 2.6 : undefined,
                  }}
                  role={isAvailable ? 'button' : undefined}
                  tabIndex={isAvailable ? 0 : -1}
                  aria-label={`${countryName}${isSelected ? translate(language, 'map.selectedSuffix') : ''}`}
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
                  <title>{pointTitle}</title>
                </path>
              )
            })}
          </g>
        </svg>
        {mapPoints.size > 0 ? (
          <div className="map-data-legend" aria-label={translate(language, 'map.legendAria', { indicator: indicatorLabel, year })}>
            <div className="map-legend-heading">
              <strong>{indicatorLabel}</strong>
              <span>{year}</span>
            </div>
            <small>{mapUnit}</small>
            <span className="map-scale-labels" aria-hidden="true">
              {legendLabels.map((label) => <span key={label}>{translate(language, label)}</span>)}
            </span>
            <span
              className="map-gradient"
              style={{ background: `linear-gradient(90deg, ${colorScale.color(colorScale.min)}, ${colorScale.color(colorScale.midpoint)}, ${colorScale.color(colorScale.max)})` }}
            />
            <span className="map-legend-values">
              <span>{legendValue(colorScale.min)}</span>
              <span>{legendValue(colorScale.midpoint)}</span>
              <span>{legendValue(colorScale.max)}</span>
            </span>
          </div>
        ) : (
          <p className="map-data-empty">{translate(language, 'map.noDataForYear', { year })}</p>
        )}
        <div className="map-controls" aria-label={translate(language, 'map.zoomControls')}>
          <button type="button" onClick={() => zoomBy(1.5)} disabled={transform.scale >= MAX_ZOOM} aria-label={translate(language, 'map.zoomIn')}>+</button>
          <button type="button" onClick={() => zoomBy(1 / 1.5)} disabled={transform.scale <= 1} aria-label={translate(language, 'map.zoomOut')}>−</button>
          <button
            type="button"
            className="map-reset"
            onClick={() => {
              const reset = { scale: 1, x: 0, y: 0 }
              transformRef.current = reset
              setTransform(reset)
            }}
            disabled={transform.scale === 1}
            aria-label={translate(language, 'map.zoomReset')}
          >
            {Math.round(transform.scale * 100)}%
          </button>
        </div>
      </div>
    </section>
  )
}
