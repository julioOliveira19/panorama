import { describe, expect, it } from 'vitest'
import { pinchTransform } from './mapGesture'

describe('pinchTransform', () => {
  it('amplia ao redor do ponto médio dos dedos', () => {
    expect(pinchTransform(
      { scale: 1, x: 0, y: 0 },
      100,
      { x: 300, y: 200 },
      200,
      { x: 300, y: 200 },
    )).toEqual({ scale: 2, x: -300, y: -200 })
  })

  it('limita o zoom e acompanha o deslocamento da pinça', () => {
    expect(pinchTransform(
      { scale: 2, x: -100, y: -50 },
      100,
      { x: 200, y: 150 },
      500,
      { x: 220, y: 180 },
    )).toEqual({ scale: 6, x: -680, y: -420 })
  })
})
