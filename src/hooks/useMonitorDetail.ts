import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import type { CheckResult, Monitor, UptimeResponse, LatencyResponse } from '../types'

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

export function useMonitor(monitorId: string) {
  return useQuery({
    queryKey: ['monitor', monitorId],
    queryFn: async () => {
      const res = await api.get<Monitor>(`/monitors/${monitorId}`)
      return res.data
    },
    enabled: !!monitorId,
  })
}

export function useRunCheck() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (monitorId: string) => {
      const res = await api.post<CheckResult>(`/health-check/${monitorId}`)
      return res.data
    },
    onSuccess: (_data, monitorId) => {
      queryClient.invalidateQueries({ queryKey: ['check-history', monitorId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['uptime', monitorId] })
      queryClient.invalidateQueries({ queryKey: ['latency', monitorId] })
      queryClient.invalidateQueries({ queryKey: ['monitor', monitorId] })
    },
  })
}
