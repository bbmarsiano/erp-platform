export interface CustomerInput {
  code: string
  name: string
  eik?: string
  vatNumber?: string
  address?: string
  city?: string
  email?: string
  phone?: string
  contactPerson?: string
}

export interface ChartOfAccountInput {
  code: string
  name: string
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'
  parentId?: string | null
}
