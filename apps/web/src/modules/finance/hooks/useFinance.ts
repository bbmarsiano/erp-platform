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

export type InvoiceLineInput = {
  productId?: string
  description: string
  quantity: number
  unitPrice: number
  vatRate?: number
}

export const useInvoices = (filters?: {
  docType?: string
  status?: string
  customerId?: string
  supplierId?: string
  from?: string
  to?: string
}) =>
  useQuery({
    queryKey: ['finance', 'invoices', filters],
    queryFn: () =>
      api.get('/api/finance/invoices', { params: filters }).then((r) => r.data.data)
  })

export const useInvoice = (id: string) =>
  useQuery({
    queryKey: ['finance', 'invoices', id],
    queryFn: () => api.get(`/api/finance/invoices/${id}`).then((r) => r.data.data),
    enabled: Boolean(id)
  })

export const useCreateInvoice = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      docType: string
      issueDate: string
      dueDate?: string
      taxEventDate?: string
      customerId?: string
      supplierId?: string
      currency?: string
      vatRate?: number
      note?: string
      lines: InvoiceLineInput[]
    }) => api.post('/api/finance/invoices', data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      qc.invalidateQueries({ queryKey: ['finance', 'receivables'] })
      qc.invalidateQueries({ queryKey: ['finance', 'payables'] })
    }
  })
}

export const useUpdateInvoice = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string
      issueDate?: string
      dueDate?: string
      taxEventDate?: string
      customerId?: string
      supplierId?: string
      currency?: string
      vatRate?: number
      note?: string
      lines?: InvoiceLineInput[]
    }) => api.put(`/api/finance/invoices/${id}`, data).then((r) => r.data.data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      qc.invalidateQueries({ queryKey: ['finance', 'invoices', vars.id] })
    }
  })
}

export const useIssueInvoice = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/finance/invoices/${id}/issue`).then((r) => r.data.data),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      qc.invalidateQueries({ queryKey: ['finance', 'invoices', id] })
      qc.invalidateQueries({ queryKey: ['finance', 'receivables'] })
      qc.invalidateQueries({ queryKey: ['finance', 'payables'] })
    }
  })
}

export const useCancelInvoice = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/finance/invoices/${id}/cancel`).then((r) => r.data.data),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
      qc.invalidateQueries({ queryKey: ['finance', 'invoices', id] })
      qc.invalidateQueries({ queryKey: ['finance', 'receivables'] })
      qc.invalidateQueries({ queryKey: ['finance', 'payables'] })
    }
  })
}

export const useReceivables = (status?: string) =>
  useQuery({
    queryKey: ['finance', 'receivables', status],
    queryFn: () =>
      api.get('/api/finance/receivables', { params: status ? { status } : undefined }).then((r) => r.data.data)
  })

export const useRecordReceivablePayment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      amount,
      paymentDate,
      note
    }: {
      id: string
      amount: number
      paymentDate?: string
      note?: string
    }) => api.post(`/api/finance/receivables/${id}/payment`, { amount, paymentDate, note }).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'receivables'] })
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
    }
  })
}

export const usePayables = (status?: string) =>
  useQuery({
    queryKey: ['finance', 'payables', status],
    queryFn: () =>
      api.get('/api/finance/payables', { params: status ? { status } : undefined }).then((r) => r.data.data)
  })

export const useRecordPayablePayment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      amount,
      paymentDate,
      note
    }: {
      id: string
      amount: number
      paymentDate?: string
      note?: string
    }) => api.post(`/api/finance/payables/${id}/payment`, { amount, paymentDate, note }).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'payables'] })
      qc.invalidateQueries({ queryKey: ['finance', 'invoices'] })
    }
  })
}

export const useJournalEntries = (filters?: { sourceType?: string; from?: string; to?: string }) =>
  useQuery({
    queryKey: ['finance', 'journal-entries', filters],
    queryFn: () =>
      api.get('/api/finance/journal-entries', { params: filters }).then((r) => r.data.data)
  })

export const useJournalEntry = (id: string) =>
  useQuery({
    queryKey: ['finance', 'journal-entries', id],
    queryFn: () => api.get(`/api/finance/journal-entries/${id}`).then((r) => r.data.data),
    enabled: Boolean(id)
  })
