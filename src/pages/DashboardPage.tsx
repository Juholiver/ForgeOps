import { useDashboardSummary } from '../hooks/useDashboard'

export function DashboardPage() {
  const { data, isLoading } = useDashboardSummary()

  if (isLoading) return <div>Loading...</div>
  if (!data) return <div>Error loading dashboard</div>

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Monitors</h3>
          <p className="stat-value">{data.total_monitors}</p>
        </div>
        <div className="stat-card">
          <h3>Active Monitors</h3>
          <p className="stat-value">{data.active_monitors}</p>
        </div>
        <div className="stat-card">
          <h3>Total Checks</h3>
          <p className="stat-value">{data.total_checks}</p>
        </div>
        <div className="stat-card">
          <h3>Open Incidents</h3>
          <p className="stat-value">{data.open_incidents}</p>
        </div>
        <div className="stat-card">
          <h3>Avg Uptime</h3>
          <p className="stat-value">{data.avg_uptime.toFixed(2)}%</p>
        </div>
        <div className="stat-card">
          <h3>Avg Latency</h3>
          <p className="stat-value">{data.avg_latency_ms.toFixed(2)}ms</p>
        </div>
      </div>
    </div>
  )
}
