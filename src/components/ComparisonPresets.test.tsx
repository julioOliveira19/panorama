import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ComparisonPresets } from './ComparisonPresets'

describe('ComparisonPresets', () => {
  it('aplica comparação e período pelos seletores', async () => {
    const onCountries = vi.fn()
    const onPeriod = vi.fn()
    render(
      <ComparisonPresets
        language="pt-BR"
        selectedCodes={['BRA', 'PER']}
        startYear={2001}
        endYear={2014}
        onCountries={onCountries}
        onPeriod={onPeriod}
      />,
    )

    await userEvent.selectOptions(screen.getByLabelText('Comparações'), 'presets.largeEconomies')
    await userEvent.selectOptions(screen.getByLabelText('Períodos'), 'presets.pandemic')

    expect(onCountries).toHaveBeenCalledWith(['BRA', 'USA', 'CHN'])
    expect(onPeriod).toHaveBeenCalledWith(2019, 2025)
  })
})
