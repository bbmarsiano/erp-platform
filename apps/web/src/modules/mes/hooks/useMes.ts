import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'

export const useBoms = () =>
  useQuery({
    queryKey: ['mes', 'bom'],
    queryFn: () => api.get('/api/mes/bom').then((r) => r.data.data)
  })

export const useBom = (productId: string) =>
  useQuery({
    enabled: Boolean(productId),
    queryKey: ['mes', 'bom', productId],
    queryFn: () => api.get(`/api/mes/bom/${productId}`).then((r) => r.data.data)
  })

export const useCreateBom = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { productId: string; version?: string }) => api.post('/api/mes/bom', data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mes', 'bom'] })
  })
}

export const useAddBomItem = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; componentId: string; quantity: number; unit?: string; note?: string }) =>
      api.post(`/api/mes/bom/${args.id}/items`, args).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mes', 'bom'] })
  })
}

export const useWorkOrders = (status?: string) =>
  useQuery({
    queryKey: ['mes', 'orders', status],
    queryFn: () => api.get('/api/mes/orders', { params: { status } }).then((r) => r.data.data)
  })

export const useWorkOrder = (id: string) =>
  useQuery({
    enabled: Boolean(id),
    queryKey: ['mes', 'orders', id],
    queryFn: () => api.get(`/api/mes/orders/${id}`).then((r) => r.data.data)
  })

export const useCreateWorkOrder = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      productId: string
      bomId?: string
      warehouseId: string
      outputLocationId: string
      plannedQty: number
      note?: string
    }) => api.post('/api/mes/orders', data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mes', 'orders'] })
  })
}

const statusMutation = (path: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/mes/orders/${id}/${path}`).then((r) => r.data.data),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['mes', 'orders'] })
      qc.invalidateQueries({ queryKey: ['mes', 'orders', id] })
      qc.invalidateQueries({ queryKey: ['wms', 'stock'] })
    }
  })
}

export const useReleaseWorkOrder = () => statusMutation('release')
export const useStartWorkOrder = () => statusMutation('start')
export const useCompleteWorkOrder = () => statusMutation('complete')

