import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CountrySelector } from './CountrySelector'
import type { Country } from '../types'

const availability = {
  growth: { minYear: 2000, maxYear: 2025, count: 26 },
  debt: null,
  gdpPerCapita: null,
  consumptionPerCapita: null,
}

const entities: Country[] = [
  { code: 'BRA', name: 'Brasil', availability },
  { code: 'ADVEC', name: 'Economias avançadas', availability },
]

describe('CountrySelector', () => {
  it('separa países de agregados e permite selecionar os dois tipos', async () => {
    const onToggle = vi.fn()
    render(
      <CountrySelector
        countries={entities}
        selectedCodes={[]}
        onToggle={onToggle}
        onRemove={vi.fn()}
        language="pt-BR"
      />,
    )

    await userEvent.type(screen.getByPlaceholderText('Busque país, território ou grupo'), 'a')
    expect(screen.getByText('Países e territórios')).toBeInTheDocument()
    expect(screen.getByText('Regiões e grupos econômicos')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('option', { name: /Economias avançadas/ }))
    expect(onToggle).toHaveBeenCalledWith('ADVEC')
  })
})
