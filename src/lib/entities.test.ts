import { describe, expect, it } from 'vitest'
import { isAggregateCode } from './entities'

describe('classificação de entidades', () => {
  it('separa países e territórios de agregados econômicos', () => {
    expect(isAggregateCode('BRA')).toBe(false)
    expect(isAggregateCode('WBG')).toBe(false)
    expect(isAggregateCode('UVK')).toBe(false)
    expect(isAggregateCode('ADVEC')).toBe(true)
    expect(isAggregateCode('WEOWORLD')).toBe(true)
  })
})
