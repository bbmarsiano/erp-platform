import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface LicenseInfo {
  valid?: boolean
  billingType?: string | null
  isTrial?: boolean
  isLifetime?: boolean
  daysRemaining?: number
}

export function useLicenseInfo() {
  return useQuery({
    queryKey: ['license-info'],
    queryFn: async () => {
      const res = await api.get('/api/license/info')
      return (res.data.data ?? null) as LicenseInfo | null
    },
    staleTime: 5 * 60 * 1000,
    retry: false
  })
}
