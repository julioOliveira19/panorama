import { describe, expect, it } from 'vitest'
import { nextFocusedCodes } from './chartFocus'

const available = new Set(['CAN', 'USA', 'MEX'])

describe('nextFocusedCodes', () => {
  it('mantém apenas um destaque no clique normal', () => {
    expect(nextFocusedCodes(['USA'], 'CAN', available, false)).toEqual(['CAN'])
    expect(nextFocusedCodes(['CAN'], 'CAN', available, false)).toEqual([])
  })

  it('combina e remove destaques com Ctrl+clique', () => {
    expect(nextFocusedCodes(['CAN'], 'MEX', available, true)).toEqual(['CAN', 'MEX'])
    expect(nextFocusedCodes(['CAN', 'MEX'], 'CAN', available, true)).toEqual(['MEX'])
  })
})
