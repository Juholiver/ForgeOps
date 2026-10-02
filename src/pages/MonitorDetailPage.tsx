import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Gauge,
  Monitor,
  Pause,
  Percent,
  Play,
  Timer,
  XCircle,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { StatusBadge } from '../components/StatusBadge'
import { useCheckHistory } from '../hooks/useCheckHistory'
import { useLatency, useMonitor, useRunCheck, useUptime } from '../hooks/useMonitorDetail'
import { useToggleMonitor } from '../hooks/useMonitors'
import type { CheckResult } from '../types'
import { formatDateTime, formatInterval, formatLatency, formatRelative } from '../lib/format'

export function MonitorDetailPage() {
  const { id = '' } = useParams()

  const monitorQuery = useMonitor(id)
  const uptime = useUptime(id, 7)
  const latency = useLatency(id, 7)
  const history = useCheckHistory(id, 1, 50, 7)
  const toggleMonitor = useToggleMonitor()
  const runCheck = useRunCheck()
  const [lastRun, setLastRun] = useState<CheckResult | null>(null)

  const monitor = monitorQuery.data

  const chartData = useMemo(() => {
    const checks = [...(history.data?.checks ?? [])]
    checks.sort((a, b) => new Date(a.checked_at).getTime() - new Date(b.checked_at).getTime())
    return checks.map((check) => ({
      time: new Date(check.checked_at).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      latency: check.response_time_ms,
    }))
  }, [history.data])

  if (!id) {
    return <Navigate to="/monitors" replace />
  }

  if (monitorQuery.isLoading) {
    return (
      <>
        <div className="skeleton skeleton--stat" />
        <div className="stats-grid stats-grid--tight">
          <div className="skeleton skeleton--stat" />
          <div className="skeleton skeleton--stat" />
          <div className="skeleton skeleton--stat" />
          <div className="skeleton skeleton--stat" />
        </div>
      </>
    )
  }

  if (monitorQuery.error || !monitor) {
    return (
      <>
        <Link to="/monitors" className="back-link">
          <ArrowLeft size={15} />
          Voltar para monitores
        </Link>
        <div className="panel">
          <div className="empty-state">
            <div className="empty-state__icon">
              <AlertTriangle size={26} />
            </div>
            <p className="empty-state__title">Monitor não encontrado</p>
            <p className="empty-state__text">Não foi possível carregar os dados deste monitor.</p>
            <Link to="/monitors" className="btn btn--primary">
              <ArrowLeft size={16} />
              Voltar
            </Link>
          </div>
        </div>
      </>
    )
  }

  const handleRun = () => {
    runCheck.mutate(id, {
      onSuccess: (result) => setLastRun(result),
    })
  }

  return (
    <>
      <Link to="/monitors" className="back-link">
        <ArrowLeft size={15} />
        Voltar para monitores
      </Link>

      <PageHeader
        icon={Monitor}
        iconVariant={monitor.active ? 'green' : 'purple'}
        title={monitor.name}
        subtitle={`${monitor.method} • a cada ${formatInterval(monitor.interval_seconds)} • timeout ${
          monitor.timeout_seconds
        }s • espera HTTP ${monitor.expected_status}`}
        actions={
          <>
            <a
              className="btn btn--ghost"
              href={monitor.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={16} />
              Abrir URL
            </a>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => toggleMonitor.mutate(id)}
              disabled={toggleMonitor.isPending}
            >
              {monitor.active ? <Pause size={16} /> : <Play size={16} />}
              {monitor.active ? 'Pausar' : 'Ativar'}
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleRun}
              disabled={runCheck.isPending}
            >
              <Activity size={16} />
              {runCheck.isPending ? 'Executando…' : 'Executar check agora'}
            </button>
          </>
        }
      />

      <div className="panel panel--mb">
        <div className="panel__header">
          <div className="panel__toolbar">
            <StatusBadge kind={monitor.active ? 'active' : 'inactive'} status="" />
            <span className="cell-muted">
              <Clock size={14} />
              Atualizado {formatRelative(monitor.updated_at)}
            </span>
          </div>
          <span className="cell-mono">{monitor.url}</span>
        </div>
        {(lastRun || runCheck.isError) && (
          <div className="panel__body panel__body--tight" role="status">
            {runCheck.isError ? (
              <div className="alert alert--error">
                <AlertTriangle size={16} />
                Falha ao executar o check. Tente novamente em instantes.
              </div>
            ) : lastRun && (
              <div
                className={`alert ${lastRun.status === 'up' ? 'alert--success' : 'alert--error'}`}
              >
                {lastRun.status === 'up' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                Check executado: HTTP {lastRun.http_status ?? '—'} •{' '}
                {formatLatency(lastRun.response_time_ms)} •{' '}
                {lastRun.error_message ?? `status "${lastRun.status}"`}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="stats-grid">
        <StatCard
          icon={Percent}
          label="Uptime (7 dias)"
          value={uptime.data ? `${uptime.data.uptime_percentage.toFixed(2)}%` : '—'}
          hint={
            uptime.data
              ? `${uptime.data.successful_checks}/${uptime.data.total_checks} checks OK`
              : 'calculando…'
          }
          accent="green"
        />
        <StatCard
          icon={Timer}
          label="Latência média"
          value={latency.data ? formatLatency(latency.data.avg_latency_ms) : '—'}
          hint="média dos últimos 7 dias"
          accent="blue"
        />
        <StatCard
          icon={Gauge}
          label="Latência p95"
          value={latency.data ? formatLatency(latency.data.p95_latency_ms) : '—'}
          hint={latency.data ? `p99 ${formatLatency(latency.data.p99_latency_ms)}` : 'calculando…'}
          accent="purple"
        />
        <StatCard
          icon={Activity}
          label="Checks (7 dias)"
          value={latency.data ? String(latency.data.total_checks) : '—'}
          hint={`mín ${latency.data ? formatLatency(latency.data.min_latency_ms) : '—'} • máx ${
            latency.data ? formatLatency(latency.data.max_latency_ms) : '—'
          }`}
          accent="cyan"
        />
      </div>

      <div className="grid-2">
        <section className="panel">
          <div className="panel__header">
            <h2 className="panel__title">
              <span className="panel__title-icon">
                <Timer size={17} />
              </span>
              Latência — últimos 7 dias
            </h2>
          </div>
          {history.isLoading ? (
            <div className="loading-state">
              <span className="spinner" />
              Carregando histórico…
            </div>
          ) : chartData.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">
                <Timer size={26} />
              </div>
              <p className="empty-state__title">Sem dados ainda</p>
              <p className="empty-state__text">Execute um check ou aguarde a próxima verificação.</p>
            </div>
          ) : (
            <div className="chart-panel">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top: 12, right: 16, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.1)" />
                  <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} minTickGap={40} />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    unit="ms"
                    width={62}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(12,19,34,.97)',
                      border: '1px solid rgba(148,163,184,.25)',
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                    labelStyle={{ color: '#94a3b8' }}
                    formatter={(value) => [`${value} ms`, 'Latência']}
                  />
                  <Line
                    type="monotone"
                    dataKey="latency"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#60a5fa' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel__header">
            <h2 className="panel__title">
              <span className="panel__title-icon panel__title-icon--purple">
                <Activity size={17} />
              </span>
              Histórico de checks
            </h2>
            <span className="pagination__info">{history.data?.total ?? 0} registro(s)</span>
          </div>
          {history.isLoading ? (
            <div className="loading-state">
              <span className="spinner" />
              Carregando checks…
            </div>
          ) : (history.data?.checks.length ?? 0) === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">
                <CheckCircle2 size={26} />
              </div>
              <p className="empty-state__title">Nenhum check registrado</p>
              <p className="empty-state__text">Execute um check manualmente para gerar o primeiro registro.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>HTTP</th>
                    <th>Latência</th>
                    <th>Quando</th>
                  </tr>
                </thead>
                <tbody>
                  {history.data!.checks.map((check) => (
                    <tr key={check.id}>
                      <td>
                        <StatusBadge kind="check" status={check.status} />
                      </td>
                      <td>
                        <span className="cell-mono">{check.http_status ?? '—'}</span>
                      </td>
                      <td>
                        <span className="cell-muted">{formatLatency(check.response_time_ms)}</span>
                      </td>
                      <td>
                        <span className="cell-muted" title={formatDateTime(check.checked_at)}>
                          {formatRelative(check.checked_at)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  )
}
