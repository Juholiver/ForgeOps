import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { runHealthCheck } from '../lib/healthCheck'
import { getLatency, getMonitor, getUptime, recordCheck } from '../services/storage'
import type { CheckResult, LatencyResponse, Monitor, UptimeResponse } from '../types'

export function useUptime(monitorId: string, days = 7) {
  return useQuery({
    queryKey: ['uptime', monitorId, days],
    queryFn: (): UptimeResponse => getUptime(monitorId, days),
    enabled: !!monitorId,
  })
}

export function useLatency(monitorId: string, days = 7) {
  return useQuery({
    queryKey: ['latency', monitorId, days],
    queryFn: (): LatencyResponse => getLatency(monitorId, days),
    enabled: !!monitorId,
  })
}

export function useMonitor(monitorId: string) {
  return useQuery({
    queryKey: ['monitor', monitorId],
    queryFn: (): Monitor | null => getMonitor(monitorId) ?? null,
    enabled: !!monitorId,
  })
}

export function useRunCheck() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (monitorId: string): Promise<CheckResult> => {
      const monitor = getMonitor(monitorId)
      if (!monitor) throw new Error('Monitor não encontrado')
      const check = await runHealthCheck(monitor)
      recordCheck(check)
      return check
    },
    onSuccess: (_data, monitorId) => {
      queryClient.invalidateQueries({ queryKey: ['check-history', monitorId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['uptime', monitorId] })
      queryClient.invalidateQueries({ queryKey: ['latency', monitorId] })
      queryClient.invalidateQueries({ queryKey: ['monitor', monitorId] })
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-incidents'] })
    },
  })
}
