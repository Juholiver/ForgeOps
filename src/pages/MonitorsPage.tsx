import { useState } from 'react'
import { useMonitors, useCreateMonitor, useToggleMonitor, useDeleteMonitor } from '../hooks/useMonitors'
import type { MonitorCreate } from '../types'

export function MonitorsPage() {
  const { data, isLoading } = useMonitors()
  const createMonitor = useCreateMonitor()
  const toggleMonitor = useToggleMonitor()
  const deleteMonitor = useDeleteMonitor()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<MonitorCreate>({
    name: '',
    url: '',
    method: 'GET',
    interval_seconds: 60,
    timeout_seconds: 30,
    expected_status: 200,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMonitor.mutate(form, {
      onSuccess: () => {
        setShowForm(false)
        setForm({ name: '', url: '', method: 'GET', interval_seconds: 60, timeout_seconds: 30, expected_status: 200 })
      },
    })
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="monitors-page">
      <div className="page-header">
        <h1>Monitors</h1>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Monitor'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="monitor-form">
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            placeholder="URL"
            type="url"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            required
          />
          <select
            value={form.method}
            onChange={(e) => setForm({ ...form, method: e.target.value })}
          >
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>DELETE</option>
          </select>
          <input
            type="number"
            placeholder="Interval (s)"
            value={form.interval_seconds}
            onChange={(e) => setForm({ ...form, interval_seconds: Number(e.target.value) })}
          />
          <input
            type="number"
            placeholder="Timeout (s)"
            value={form.timeout_seconds}
            onChange={(e) => setForm({ ...form, timeout_seconds: Number(e.target.value) })}
          />
          <input
            type="number"
            placeholder="Expected Status"
            value={form.expected_status}
            onChange={(e) => setForm({ ...form, expected_status: Number(e.target.value) })}
          />
          <button type="submit">Create</button>
        </form>
      )}

      <table className="monitors-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>URL</th>
            <th>Method</th>
            <th>Interval</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data?.items.map((monitor) => (
            <tr key={monitor.id}>
              <td>{monitor.name}</td>
              <td>{monitor.url}</td>
              <td>{monitor.method}</td>
              <td>{monitor.interval_seconds}s</td>
              <td>
                <span className={`status-badge ${monitor.active ? 'active' : 'inactive'}`}>
                  {monitor.active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <button onClick={() => toggleMonitor.mutate(monitor.id)}>
                  {monitor.active ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => deleteMonitor.mutate(monitor.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
