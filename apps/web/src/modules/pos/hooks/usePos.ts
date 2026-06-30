import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'

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

