export type SupplierInput = {
  code: string
  name: string
  contactName?: string
  email?: string
  phone?: string
  address?: string
  taxNumber?: string
}

export type PurchaseOrderLineInput = {
  productId: string
  quantity: number
  unitPrice?: number
  unit?: string
}

export type DeliveryLineInput = {
  productId: string
  locationId: string
  quantity: number
  lotNumber?: string
  expiryDate?: string
}

