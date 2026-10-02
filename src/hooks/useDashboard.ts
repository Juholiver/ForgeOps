import { useQuery } from '@tanstack/react-query'
import { getDashboardSummary } from '../services/storage'
import type { DashboardSummary } from '../types'

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: (): DashboardSummary => getDashboardSummary(),
  })
}
