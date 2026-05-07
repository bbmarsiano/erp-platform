import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'

export const useSuppliers = () =>
  useQuery({
    queryKey: ['scm', 'suppliers'],
    queryFn: () => api.get('/api/scm/suppliers').then((r) => r.data.data)
  })

export const useCreateSupplier = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      code: string
      name: string
      contactName?: string
      phone?: string
      email?: string
      address?: string
      taxNumber?: string
    }) => api.post('/api/scm/suppliers', data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scm', 'suppliers'] })
  })
}

export const usePurchaseOrders = (filters?: { status?: string; supplierId?: string }) =>
  useQuery({
    queryKey: ['scm', 'orders', filters?.status, filters?.supplierId],
    queryFn: () => api.get('/api/scm/orders', { params: filters }).then((r) => r.data.data)
  })

export const usePurchaseOrder = (id: string) =>
  useQuery({
    enabled: Boolean(id),
    queryKey: ['scm', 'orders', id],
    queryFn: () => api.get(`/api/scm/orders/${id}`).then((r) => r.data.data)
  })

export const useCreatePurchaseOrder = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { supplierId: string; warehouseId: string; expectedDate?: string; note?: string }) =>
      api.post('/api/scm/orders', data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scm', 'orders'] })
  })
}

export const useAddPurchaseOrderLine = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; productId: string; quantity: number; unitPrice?: number; unit?: string }) =>
      api.post(`/api/scm/orders/${args.id}/lines`, args).then((r) => r.data.data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['scm', 'orders', vars.id] })
  })
}

export const useSendPurchaseOrder = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/scm/orders/${id}/send`).then((r) => r.data.data),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['scm', 'orders'] })
      qc.invalidateQueries({ queryKey: ['scm', 'orders', id] })
    }
  })
}

export const useDeliveries = () =>
  useQuery({
    queryKey: ['scm', 'deliveries'],
    queryFn: () => api.get('/api/scm/deliveries').then((r) => r.data.data)
  })

export const useDelivery = (id: string) =>
  useQuery({
    enabled: Boolean(id),
    queryKey: ['scm', 'deliveries', id],
    queryFn: () => api.get(`/api/scm/deliveries/${id}`).then((r) => r.data.data)
  })

export const useCreateDelivery = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      purchaseOrderId?: string
      warehouseId: string
      supplierName?: string
      deliveryDate?: string
      note?: string
    }) => api.post('/api/scm/deliveries', data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scm', 'deliveries'] })
  })
}

export const useAddDeliveryLine = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: {
      id: string
      productId: string
      locationId: string
      quantity: number
      lotNumber?: string
      expiryDate?: string
    }) => api.post(`/api/scm/deliveries/${args.id}/lines`, args).then((r) => r.data.data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['scm', 'deliveries', vars.id] })
  })
}

export const useConfirmDelivery = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/scm/deliveries/${id}/confirm`).then((r) => r.data.data),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['scm', 'deliveries'] })
      qc.invalidateQueries({ queryKey: ['scm', 'deliveries', id] })
      qc.invalidateQueries({ queryKey: ['wms', 'receipts'] })
      qc.invalidateQueries({ queryKey: ['wms', 'stock'] })
      qc.invalidateQueries({ queryKey: ['scm', 'orders'] })
    }
  })
}

