import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import type { CheckHistoryResponse } from '../types'

export function useCheckHistory(monitorId: string, page = 1, pageSize = 50, days = 7) {
  return useQuery({
    queryKey: ['check-history', monitorId, page, pageSize, days],
    queryFn: async () => {
      const res = await api.get<CheckHistoryResponse>(`/dashboard/history/${monitorId}`, {
        params: { page, page_size: pageSize, days },
      })
      return res.data
    },
    enabled: !!monitorId,
  })
}
