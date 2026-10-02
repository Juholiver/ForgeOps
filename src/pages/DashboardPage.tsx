import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Gauge,
  Monitor,
  Plus,
  RefreshCw,
  Timer,
} from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { StatusBadge } from '../components/StatusBadge'
import { useDashboardSummary } from '../hooks/useDashboard'
import { useMonitors } from '../hooks/useMonitors'
import { useIncidents } from '../hooks/useIncidents'
import { formatInterval, formatLatency, formatRelative } from '../lib/format'

export function DashboardPage() {
  const navigate = useNavigate()
  const { data, isLoading, error, refetch, isFetching } = useDashboardSummary()
  const monitors = useMonitors(1, 5)
  const incidents = useIncidents(1, 5)

  const handleRefresh = () => refetch()

  if (isLoading) {
    return (
      <>
        <PageHeader icon={Activity} title="Dashboard" subtitle="Visão geral da saúde das suas APIs em tempo real." />
        <div className="stats-grid">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton skeleton--stat" />
          ))}
        </div>
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        <PageHeader icon={Activity} title="Dashboard" subtitle="Visão geral da saúde das suas APIs." />
        <div className="panel">
          <div className="empty-state">
            <div className="empty-state__icon">
              <AlertTriangle size={28} />
            </div>
            <p className="empty-state__title">Erro ao carregar o dashboard</p>
            <p className="empty-state__text">Não foi possível obter o resumo local.</p>
            <button type="button" className="btn btn--primary" onClick={handleRefresh}>
              <RefreshCw size={16} />
              Tentar novamente
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        icon={Activity}
        title="Dashboard"
        subtitle="Visão geral da saúde das suas APIs em tempo real."
        actions={
          <>
            <button type="button" className="btn btn--ghost" onClick={handleRefresh} disabled={isFetching}>
              <RefreshCw size={16} />
              {isFetching ? 'Atualizando…' : 'Atualizar'}
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => navigate('/monitors', { state: { openForm: true } })}
            >
              <Plus size={17} />
              Novo monitor
            </button>
          </>
        }
      />

      <div className="stats-grid">
        <StatCard
          icon={Monitor}
          label="Total de monitores"
          value={String(data.total_monitors)}
          hint={`${data.active_monitors} ativo(s) monitorando`}
          accent="blue"
          to="/monitors"
        />
        <StatCard
          icon={CheckCircle2}
          label="Monitores ativos"
          value={String(data.active_monitors)}
          hint={`${data.total_monitors > 0 ? Math.round((data.active_monitors / data.total_monitors) * 100) : 0}% da frota`}
          accent="green"
          to="/monitors"
        />
        <StatCard
          icon={Activity}
          label="Total de checks"
          value={data.total_checks.toLocaleString('pt-BR')}
          hint="execuções registradas"
          accent="cyan"
        />
        <StatCard
          icon={AlertTriangle}
          label="Incidentes abertos"
          value={String(data.open_incidents)}
          hint={`de ${data.total_incidents} no total`}
          accent="red"
          to="/incidents"
        />
        <StatCard
          icon={Gauge}
          label="Uptime médio"
          value={`${data.avg_uptime.toFixed(2)}%`}
          hint="disponibilidade agregada"
          accent="purple"
        />
        <StatCard
          icon={Timer}
          label="Latência média"
          value={formatLatency(data.avg_latency_ms)}
          hint="tempo de resposta médio"
          accent="amber"
        />
      </div>

      <div className="grid-2">
        <section className="panel">
          <div className="panel__header">
            <h2 className="panel__title">
              <span className="panel__title-icon">
                <Monitor size={17} />
              </span>
              Monitores recentes
            </h2>
            <Link to="/monitors" className="btn btn--ghost btn--sm">
              Ver todos
              <ArrowRight size={15} />
            </Link>
          </div>
          {monitors.isLoading ? (
            <div className="loading-state">
              <span className="spinner" />
              Carregando monitores…
            </div>
          ) : (monitors.data?.items.length ?? 0) === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">
                <Monitor size={26} />
              </div>
              <p className="empty-state__title">Nenhum monitor ainda</p>
              <p className="empty-state__text">Crie seu primeiro monitor para começar a acompanhar suas APIs.</p>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => navigate('/monitors', { state: { openForm: true } })}
              >
                <Plus size={16} />
                Criar monitor
              </button>
            </div>
          ) : (
            <ul className="mini-list">
              {monitors.data!.items.map((monitor) => (
                <li key={monitor.id} className="mini-list__item">
                  <div className="mini-list__main">
                    <Link to={`/monitors/${monitor.id}`} className="mini-list__title">
                      {monitor.name}
                    </Link>
                    <span className="mini-list__sub">
                      {monitor.method} • a cada {formatInterval(monitor.interval_seconds)}
                    </span>
                  </div>
                  <div className="mini-list__side">
                    <StatusBadge kind={monitor.active ? 'active' : 'inactive'} status="" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="panel__header">
            <h2 className="panel__title">
              <span className="panel__title-icon panel__title-icon--red">
                <AlertTriangle size={17} />
              </span>
              Incidentes recentes
            </h2>
            <Link to="/incidents" className="btn btn--ghost btn--sm">
              Ver todos
              <ArrowRight size={15} />
            </Link>
          </div>
          {incidents.isLoading ? (
            <div className="loading-state">
              <span className="spinner" />
              Carregando incidentes…
            </div>
          ) : (incidents.data?.items.length ?? 0) === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">
                <CheckCircle2 size={26} />
              </div>
              <p className="empty-state__title">Nenhum incidente</p>
              <p className="empty-state__text">Tudo em ordem por aqui. Incidentes aparecerão assim que falhas forem detectadas.</p>
            </div>
          ) : (
            <ul className="mini-list">
              {incidents.data!.items.map((incident) => (
                <li key={incident.id} className="mini-list__item">
                  <div className="mini-list__main">
                    <Link to={`/monitors/${incident.monitor_id}`} className="mini-list__title">
                      {incident.reason}
                    </Link>
                    <span className="mini-list__sub">
                      Monitor {incident.monitor_id.slice(0, 8)} • {formatRelative(incident.started_at)}
                    </span>
                  </div>
                  <div className="mini-list__side">
                    <StatusBadge kind="incident" status={incident.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
