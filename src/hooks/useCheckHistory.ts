import { useQuery } from '@tanstack/react-query'
import { getCheckHistory } from '../services/storage'
import type { CheckHistoryResponse } from '../types'

export function useCheckHistory(monitorId: string, page = 1, pageSize = 50, days = 7) {
  return useQuery({
    queryKey: ['check-history', monitorId, page, pageSize, days],
    queryFn: (): CheckHistoryResponse => getCheckHistory(monitorId, page, pageSize, days),
    enabled: !!monitorId,
  })
}
