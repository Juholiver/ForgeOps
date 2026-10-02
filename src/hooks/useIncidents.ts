import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getIncidentSummary, listIncidents, updateIncidentStatus } from '../services/storage'
import type { Incident, PaginatedResponse } from '../types'
import type { IncidentSummary } from '../lib/stats'

export type IncidentStatusFilter = 'open' | 'investigating' | 'resolved'
export type IncidentStatusValue = IncidentStatusFilter

export function useIncidents(page = 1, pageSize = 20, status?: IncidentStatusFilter) {
  return useQuery({
    queryKey: ['incidents', page, pageSize, status ?? 'all'],
    queryFn: (): PaginatedResponse<Incident> => listIncidents(page, pageSize, status),
  })
}

export function useIncidentSummary() {
  return useQuery({
    queryKey: ['dashboard-incidents'],
    queryFn: (): IncidentSummary => getIncidentSummary(),
  })
}

export function useUpdateIncidentStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: IncidentStatusValue }) =>
      updateIncidentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-incidents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })
}
