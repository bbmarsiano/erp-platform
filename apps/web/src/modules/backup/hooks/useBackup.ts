import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'

export const useBackupPolicies = () =>
  useQuery({
    queryKey: ['backup', 'policies'],
    queryFn: () => api.get('/api/backup/policies').then((r) => r.data.data)
  })

export const useCreateBackupPolicy = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      name: string
      schedule: string
      retentionDays?: number
      targetType?: 'LOCAL' | 'NETWORK' | 'S3'
      targetPath?: string
      isEncrypted?: boolean
    }) => api.post('/api/backup/policies', data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['backup', 'policies'] })
  })
}

export const useRunPolicy = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/backup/policies/${id}/run`).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['backup', 'jobs'] })
  })
}

export const useBackupJobs = (filters?: { status?: string; policyId?: string }) =>
  useQuery({
    queryKey: ['backup', 'jobs', filters?.status, filters?.policyId],
    queryFn: () => api.get('/api/backup/jobs', { params: filters }).then((r) => r.data.data)
  })

export const useVerifyBackupJob = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/backup/jobs/${id}/verify`).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['backup', 'jobs'] })
  })
}

export const useRestorePoints = () =>
  useQuery({
    queryKey: ['backup', 'restore-points'],
    queryFn: () => api.get('/api/backup/restore/points').then((r) => r.data.data)
  })

export const useTestRestore = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { jobId: string; note?: string }) => api.post('/api/backup/restore/test', data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['backup', 'restore-points'] })
      qc.invalidateQueries({ queryKey: ['backup', 'jobs'] })
    }
  })
}

