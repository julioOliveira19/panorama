import { describe, expect, it } from 'vitest'
import { localizedCountryName, saveLanguage, translate } from './i18n'

describe('i18n', () => {
  it('traduz a interface nos três idiomas', () => {
    expect(translate('pt-BR', 'controls.both')).toBe('Ambos')
    expect(translate('en', 'controls.both')).toBe('Both')
    expect(translate('es', 'controls.both')).toBe('Ambos')
  })

  it('localiza nomes de países', () => {
    expect(localizedCountryName('pt-BR', 'JPN', 'Japan')).toBe('Japão')
    expect(localizedCountryName('en', 'JPN', 'Japan')).toBe('Japan')
    expect(localizedCountryName('es', 'JPN', 'Japan')).toBe('Japón')
  })

  it('salva a preferência e atualiza o idioma do documento', () => {
    saveLanguage('en')

    expect(localStorage.getItem('panorama-language')).toBe('en')
    expect(document.documentElement.lang).toBe('en')
    expect(document.title).toBe('Panorama — Country comparator')
  })
})
