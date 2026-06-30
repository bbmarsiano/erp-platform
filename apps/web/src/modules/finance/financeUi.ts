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

export const invoiceStatusMap: Record<string, { label: string; bg: string; color: string }> = {
  DRAFT: { label: 'Чернова', bg: '#f3f4f6', color: '#374151' },
  ISSUED: { label: 'Издадена', bg: '#dbeafe', color: '#1e40af' },
  PAID: { label: 'Платена', bg: '#dcfce7', color: '#166534' },
  PARTIALLY_PAID: { label: 'Частично платена', bg: '#fef3c7', color: '#92400e' },
  CANCELLED: { label: 'Анулирана', bg: '#fee2e2', color: '#991b1b' },
  VOID: { label: 'Невалидна', bg: '#f3f4f6', color: '#6b7280' }
}

export const receivableStatusMap: Record<string, { label: string; bg: string; color: string }> = {
  OPEN: { label: 'Отворено', bg: '#dbeafe', color: '#1e40af' },
  PARTIALLY_PAID: { label: 'Частично платено', bg: '#fef3c7', color: '#92400e' },
  PAID: { label: 'Платено', bg: '#dcfce7', color: '#166534' },
  OVERDUE: { label: 'Просрочено', bg: '#fee2e2', color: '#991b1b' }
}

export const docTypeLabels: Record<string, string> = {
  INVOICE_OUT: 'Изходяща',
  INVOICE_IN: 'Входяща',
  CREDIT_NOTE: 'Кредитно известие',
  DEBIT_NOTE: 'Дебитно известие'
}

export const journalSourceTypeMap: Record<string, { label: string; bg: string; color: string }> = {
  POS_SALE: { label: 'POS продажба', bg: '#dbeafe', color: '#1e40af' },
  SCM_DELIVERY: { label: 'SCM доставка', bg: '#ede9fe', color: '#6d28d9' },
  MANUAL: { label: 'Ръчен', bg: '#f3f4f6', color: '#374151' },
  INVOICE: { label: 'Фактура', bg: '#dcfce7', color: '#166534' }
}
