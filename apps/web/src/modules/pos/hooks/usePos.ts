import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'

export type CounterpartyInput = {
  name: string
  eik?: string
  vatNumber?: string
  address?: string
  city?: string
  email?: string
  phone?: string
  contactPerson?: string
}

export type CreatePosInvoiceInput = {
  saleId: string
  customerId: string
  issueDate: string
  dueDate?: string
  taxEventDate?: string
  vatRate?: number
  note?: string
  overrideNumber?: string
}

export const useRegisters = () =>
  useQuery({
    queryKey: ['pos', 'registers'],
    queryFn: () => api.get('/api/pos/registers').then((r) => r.data.data)
  })

export const useCreateRegister = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { code: string; name: string; warehouseId: string; locationId: string }) =>
      api.post('/api/pos/registers', data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pos', 'registers'] })
  })
}

export const useSales = (filters?: { date?: string; registerId?: string }) =>
  useQuery({
    queryKey: ['pos', 'sales', filters?.date, filters?.registerId],
    queryFn: () => api.get('/api/pos/sales', { params: filters }).then((r) => r.data.data)
  })

export const useSale = (id: string) =>
  useQuery({
    enabled: Boolean(id),
    queryKey: ['pos', 'sales', id],
    queryFn: () => api.get(`/api/pos/sales/${id}`).then((r) => r.data.data)
  })

export const useCreateSale = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      cashRegisterId: string
      customerId?: string
      paymentMethod: 'CASH' | 'CARD' | 'MIXED'
      lines: Array<{ productId: string; locationId: string; quantity: number; unitPrice: number }>
    }) => api.post('/api/pos/sales', data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pos', 'sales'] })
      qc.invalidateQueries({ queryKey: ['wms', 'stock'] })
      qc.invalidateQueries({ queryKey: ['finance', 'journal-entries'] })
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      qc.invalidateQueries({ queryKey: ['pos', 'counterparties'] })
    }
  })
}

export const useRefundSale = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/pos/sales/${id}/refund`).then((r) => r.data.data),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['pos', 'sales'] })
      qc.invalidateQueries({ queryKey: ['pos', 'sales', id] })
      qc.invalidateQueries({ queryKey: ['wms', 'stock'] })
    }
  })
}

export const useCounterparties = (enabled = true, search?: string) =>
  useQuery({
    enabled,
    queryKey: ['pos', 'counterparties', search],
    queryFn: () =>
      api.get('/api/pos/counterparties', { params: search ? { search } : undefined }).then((r) => r.data.data)
  })

export const useCounterparty = (id: string) =>
  useQuery({
    enabled: Boolean(id),
    queryKey: ['pos', 'counterparties', id],
    queryFn: () => api.get(`/api/pos/counterparties/${id}`).then((r) => r.data.data)
  })

export const useCreateCounterparty = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CounterpartyInput) => api.post('/api/pos/counterparties', data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pos', 'counterparties'] })
  })
}

export const useUpdateCounterparty = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: CounterpartyInput & { id: string }) =>
      api.put(`/api/pos/counterparties/${id}`, data).then((r) => r.data.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pos', 'counterparties'] })
      qc.invalidateQueries({ queryKey: ['pos', 'counterparties', vars.id] })
    }
  })
}

export const useDeleteCounterparty = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/pos/counterparties/${id}`).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pos', 'counterparties'] })
  })
}

export const usePosInvoices = (filters?: { status?: string; customerId?: string }) =>
  useQuery({
    queryKey: ['pos', 'invoices', filters?.status, filters?.customerId],
    queryFn: () => api.get('/api/pos/invoices', { params: filters }).then((r) => r.data.data)
  })

export const usePosInvoice = (id: string) =>
  useQuery({
    enabled: Boolean(id),
    queryKey: ['pos', 'invoices', id],
    queryFn: () => api.get(`/api/pos/invoices/${id}`).then((r) => r.data.data)
  })

export const useNextPosInvoiceNumber = (enabled = true) =>
  useQuery({
    enabled,
    queryKey: ['pos', 'invoices', 'next-number'],
    queryFn: () => api.get('/api/pos/invoices/next-number').then((r) => r.data.data.number as string)
  })

export const useCreatePosInvoice = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePosInvoiceInput) => api.post('/api/pos/invoices', data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pos', 'invoices'] })
      qc.invalidateQueries({ queryKey: ['pos', 'invoices', 'next-number'] })
      qc.invalidateQueries({ queryKey: ['tenant'] })
    }
  })
}

export const useCancelPosInvoice = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/pos/invoices/${id}/cancel`).then((r) => r.data.data),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['pos', 'invoices'] })
      qc.invalidateQueries({ queryKey: ['pos', 'invoices', id] })
    }
  })
}

export async function downloadPosInvoicePdf(id: string, number: string) {
  const response = await api.get(`/api/pos/invoices/${id}/pdf`, { responseType: 'blob' })
  const url = URL.createObjectURL(response.data)
  const a = document.createElement('a')
  a.href = url
  a.download = `invoice-${number}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

