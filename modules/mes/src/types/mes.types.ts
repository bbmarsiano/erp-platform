export type BomItemInput = {
  componentId: string
  quantity: number
  unit?: string
  note?: string
}

export type WorkOrderCreateInput = {
  productId: string
  bomId?: string
  warehouseId: string
  outputLocationId: string
  plannedQty: number
  plannedStart?: string
  plannedEnd?: string
  note?: string
}

