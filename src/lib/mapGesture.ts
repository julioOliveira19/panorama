export type GesturePoint = {
  x: number
  y: number
}

export type GestureTransform = {
  scale: number
  x: number
  y: number
}

export function pinchTransform(
  initial: GestureTransform,
  initialDistance: number,
  initialMidpoint: GesturePoint,
  currentDistance: number,
  currentMidpoint: GesturePoint,
  minScale = 1,
  maxScale = 6,
): GestureTransform {
  const safeDistance = Math.max(initialDistance, 1)
  const scale = Math.min(maxScale, Math.max(minScale, initial.scale * currentDistance / safeDistance))
  const contentX = (initialMidpoint.x - initial.x) / initial.scale
  const contentY = (initialMidpoint.y - initial.y) / initial.scale

  return {
    scale,
    x: currentMidpoint.x - contentX * scale,
    y: currentMidpoint.y - contentY * scale,
  }
}
