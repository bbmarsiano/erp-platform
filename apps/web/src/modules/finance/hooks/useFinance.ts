import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'

export const useCustomers = (search?: string) =>
  useQuery({
    queryKey: ['finance', 'customers', search],
    queryFn: () =>
      api.get('/api/finance/customers', { params: search ? { search } : undefined }).then((r) => r.data.data)
  })

export const useCustomer = (id: string) =>
  useQuery({
    queryKey: ['finance', 'customers', id],
    queryFn: () => api.get(`/api/finance/customers/${id}`).then((r) => r.data.data),
    enabled: Boolean(id)
  })

export const useCreateCustomer = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      code: string
      name: string
      eik?: string
      vatNumber?: string
      address?: string
      city?: string
      email?: string
      phone?: string
      contactPerson?: string
    }) => api.post('/api/finance/customers', data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'customers'] })
  })
}

export const useUpdateCustomer = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; code?: string; name?: string; eik?: string; vatNumber?: string; address?: string; city?: string; email?: string; phone?: string; contactPerson?: string }) =>
      api.put(`/api/finance/customers/${id}`, data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'customers'] })
  })
}

export const useChartOfAccounts = () =>
  useQuery({
    queryKey: ['finance', 'chart-of-accounts'],
    queryFn: () => api.get('/api/finance/chart-of-accounts').then((r) => r.data.data)
  })

export const useCreateChartOfAccount = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      code: string
      name: string
      accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'
      parentId?: string | null
    }) => api.post('/api/finance/chart-of-accounts', data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'chart-of-accounts'] })
  })
}
