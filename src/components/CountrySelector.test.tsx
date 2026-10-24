import { render, screen, within } from '@testing-library/react'
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

  it('permite adicionar uma sexta entidade', async () => {
    const onToggle = vi.fn()
    const manyEntities: Country[] = [
      { code: 'BRA', name: 'Brasil', availability },
      { code: 'ARG', name: 'Argentina', availability },
      { code: 'CHL', name: 'Chile', availability },
      { code: 'PER', name: 'Peru', availability },
      { code: 'URY', name: 'Uruguai', availability },
      { code: 'COL', name: 'Colômbia', availability },
    ]
    const view = render(
      <CountrySelector
        countries={manyEntities}
        selectedCodes={['BRA', 'ARG', 'CHL', 'PER', 'URY']}
        onToggle={onToggle}
        onRemove={vi.fn()}
        language="pt-BR"
      />,
    )

    const current = within(view.container)
    await userEvent.type(current.getByPlaceholderText('Busque país, território ou grupo'), 'Colômbia')
    await userEvent.click(current.getByRole('option', { name: /Colômbia/ }))
    expect(onToggle).toHaveBeenCalledWith('COL')
  })
})
