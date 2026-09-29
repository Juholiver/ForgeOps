import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import type { Incident, PaginatedResponse } from '../types'

export type IncidentStatusFilter = 'open' | 'investigating' | 'resolved'
export type IncidentStatusValue = IncidentStatusFilter

export function useIncidents(page = 1, pageSize = 20, status?: IncidentStatusFilter) {
  return useQuery({
    queryKey: ['incidents', page, pageSize, status ?? 'all'],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Incident>>('/incidents', {
        params: { page, page_size: pageSize, status },
      })
      return res.data
    },
  })
}

interface IncidentSummary {
  total: number
  open: number
  investigating: number
  resolved: number
}

export function useIncidentSummary() {
  return useQuery({
    queryKey: ['dashboard-incidents'],
    queryFn: async () => {
      const res = await api.get<IncidentSummary>('/dashboard/incidents')
      return res.data
    },
  })
}

export function useUpdateIncidentStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: IncidentStatusValue }) => {
      const res = await api.patch<Incident>(`/incidents/${id}`, { status })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-incidents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })
}
