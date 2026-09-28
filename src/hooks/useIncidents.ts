import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import type { Incident, PaginatedResponse } from '../types'

export function useIncidents(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['incidents', page, pageSize],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Incident>>('/incidents', {
        params: { page, page_size: pageSize },
      })
      return res.data
    },
  })
}
