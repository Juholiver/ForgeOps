import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createMonitor, deleteMonitor, listMonitors, toggleMonitor } from '../services/storage'
import type { Monitor, MonitorCreate, PaginatedResponse } from '../types'

export function useMonitors(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['monitors', page, pageSize],
    queryFn: (): PaginatedResponse<Monitor> => listMonitors(page, pageSize),
  })
}

export function useCreateMonitor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: MonitorCreate) => createMonitor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })
}

export function useToggleMonitor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => toggleMonitor(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] })
      queryClient.invalidateQueries({ queryKey: ['monitor', id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })
}

export function useDeleteMonitor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => deleteMonitor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-incidents'] })
    },
  })
}
