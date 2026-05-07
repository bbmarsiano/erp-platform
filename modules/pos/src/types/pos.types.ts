// Hardware integration interfaces (for future driver implementation)
export interface SaleReceiptLine {
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface SaleReceipt {
  saleNo: string
  createdAt: string
  paymentMethod: 'CASH' | 'CARD' | 'MIXED'
  lines: SaleReceiptLine[]
  totalAmount: number
}

export interface FiscalDeviceDriver {
  printReceipt(sale: SaleReceipt): Promise<void>
  openCashDrawer(): Promise<void>
  printReport(type: 'X' | 'Z'): Promise<void>
}

export interface BarcodeScanner {
  onScan(callback: (barcode: string) => void): void
  disconnect(): void
}
// Note: Actual hardware drivers to be implemented per client hardware

