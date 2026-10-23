const valueFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
  timeZone: 'America/Sao_Paulo',
})

export function formatValue(value: number | null | undefined) {
  return value == null ? '—' : valueFormatter.format(value)
}

export function formatSigned(value: number | null | undefined) {
  if (value == null) return '—'
  return `${value > 0 ? '+' : ''}${formatValue(value)}`
}

export function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}

export function statusLabel(status: string) {
  if (status === 'projection') return 'projeção'
  if (status === 'estimate') return 'estimativa'
  return 'observação'
}
