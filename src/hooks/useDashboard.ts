import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import type { DashboardSummary } from '../types'

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const res = await api.get<DashboardSummary>('/dashboard/summary')
      return res.data
    },
  })
}
