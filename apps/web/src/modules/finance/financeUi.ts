import type { CSSProperties } from 'react'

export const financeTableThStyle: CSSProperties = {
  padding: '12px 16px',
  fontSize: 11,
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  textAlign: 'left'
}

export const financeTableTdStyle: CSSProperties = {
  padding: '12px 16px',
  fontSize: 14
}

export const financeTableRowStyle: CSSProperties = {
  borderBottom: '1px solid #f3f4f6',
  transition: 'background 0.1s'
}

export const accountTypeLabels: Record<string, string> = {
  ASSET: 'Активи',
  LIABILITY: 'Пасиви',
  EQUITY: 'Капитал',
  REVENUE: 'Приходи',
  EXPENSE: 'Разходи'
}
