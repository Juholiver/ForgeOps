import { useIncidents } from '../hooks/useIncidents'

export function IncidentsPage() {
  const { data, isLoading } = useIncidents()

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="incidents-page">
      <h1>Incidents</h1>
      <table className="incidents-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Monitor</th>
            <th>Status</th>
            <th>Reason</th>
            <th>Started</th>
            <th>Resolved</th>
          </tr>
        </thead>
        <tbody>
          {data?.items.map((incident) => (
            <tr key={incident.id}>
              <td>{incident.id.slice(0, 8)}</td>
              <td>{incident.monitor_id.slice(0, 8)}</td>
              <td>
                <span className={`status-badge ${incident.status}`}>
                  {incident.status}
                </span>
              </td>
              <td>{incident.reason}</td>
              <td>{new Date(incident.started_at).toLocaleString()}</td>
              <td>{incident.resolved_at ? new Date(incident.resolved_at).toLocaleString() : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
