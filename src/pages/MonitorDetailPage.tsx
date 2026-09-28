import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '../services/api'
import type { CheckHistoryResponse } from '../types'

export function MonitorDetailPage({ monitorId }: { monitorId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['check-history', monitorId],
    queryFn: async () => {
      const res = await api.get<CheckHistoryResponse>(`/dashboard/history/${monitorId}`)
      return res.data
    },
  })

  if (isLoading) return <div>Loading...</div>

  const chartData = data?.checks.map((check) => ({
    time: new Date(check.checked_at).toLocaleTimeString(),
    latency: check.response_time_ms,
    status: check.status,
  }))

  return (
    <div className="monitor-detail">
      <h1>Monitor Detail</h1>
      <div className="chart-container">
        <h2>Response Time History</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="latency" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
