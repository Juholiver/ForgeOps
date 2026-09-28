import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import type { UptimeResponse, LatencyResponse } from '../types'

export function useUptime(monitorId: string, days = 7) {
  return useQuery({
    queryKey: ['uptime', monitorId, days],
    queryFn: async () => {
      const res = await api.get<UptimeResponse>(`/dashboard/uptime/${monitorId}`, {
        params: { days },
      })
      return res.data
    },
    enabled: !!monitorId,
  })
}

export function useLatency(monitorId: string, days = 7) {
  return useQuery({
    queryKey: ['latency', monitorId, days],
    queryFn: async () => {
      const res = await api.get<LatencyResponse>(`/dashboard/latency/${monitorId}`, {
        params: { days },
      })
      return res.data
    },
    enabled: !!monitorId,
  })
}
