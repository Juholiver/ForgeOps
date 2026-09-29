import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  ShieldAlert,
} from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { StatusBadge } from '../components/StatusBadge'
import {
  useIncidents,
  useIncidentSummary,
  useUpdateIncidentStatus,
  type IncidentStatusFilter,
} from '../hooks/useIncidents'
import { formatDateTime, formatRelative, shortId } from '../lib/format'

const PAGE_SIZE = 10

export function IncidentsPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<'all' | IncidentStatusFilter>('all')
  const [search, setSearch] = useState('')

  const summary = useIncidentSummary()
  const { data, isLoading, error } = useIncidents(page, PAGE_SIZE, statusFilter === 'all' ? undefined : statusFilter)
  const updateStatus = useUpdateIncidentStatus()

  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    const items = data?.items ?? []
    if (!term) return items
    return items.filter(
      (i) => i.reason.toLowerCase().includes(term) || i.monitor_id.toLowerCase().includes(term),
    )
  }, [data, search])

  const items = data?.items ?? []
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE))
  const hasFilters = statusFilter !== 'all' || search.trim() !== ''

  const handleUpdate = (id: string, status: IncidentStatusFilter) => {
    updateStatus.mutate({ id, status })
  }

  return (
    <>
      <PageHeader
        icon={AlertTriangle}
        iconVariant="red"
        title="Incidentes"
        subtitle="Histórico de falhas detectadas e o andamento de cada resolução."
      />

      <div className="stats-grid">
        <StatCard
          icon={ShieldAlert}
          label="Em aberto"
          value={String(summary.data?.open ?? 0)}
          hint="aguardando triagem"
          accent="red"
        />
        <StatCard
          icon={Eye}
          label="Investigando"
          value={String(summary.data?.investigating ?? 0)}
          hint="em análise"
          accent="amber"
        />
        <StatCard
          icon={CheckCircle2}
          label="Resolvidos"
          value={String(summary.data?.resolved ?? 0)}
          hint="falhas superadas"
          accent="green"
        />
        <StatCard
          icon={AlertTriangle}
          label="Total"
          value={String(summary.data?.total ?? 0)}
          hint="incidentes registrados"
          accent="blue"
        />
      </div>

      <section className="panel">
        <div className="panel__header">
          <div className="panel__toolbar">
            <span className="search-field">
              <Search size={16} />
              <input
                className="input input--search"
                placeholder="Buscar por motivo ou monitor…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar incidentes"
              />
            </span>
            <select
              className="select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | IncidentStatusFilter)}
              aria-label="Filtrar por status"
            >
              <option value="all">Todos os status</option>
              <option value="open">Abertos</option>
              <option value="investigating">Investigando</option>
              <option value="resolved">Resolvidos</option>
            </select>
          </div>
          <span className="pagination__info">{data?.total ?? 0} incidente(s)</span>
        </div>

        {isLoading ? (
          <div className="panel__body">
            <div className="skeleton skeleton--row" />
            <div className="skeleton skeleton--row" />
            <div className="skeleton skeleton--row" />
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <AlertTriangle size={26} />
            </div>
            <p className="empty-state__title">Erro ao carregar incidentes</p>
            <p className="empty-state__text">Não foi possível listar os incidentes. Tente novamente.</p>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <CheckCircle2 size={26} />
            </div>
            <p className="empty-state__title">{hasFilters ? 'Nenhum resultado' : 'Nenhum incidente'}</p>
            <p className="empty-state__text">
              {hasFilters
                ? 'Nenhum incidente corresponde aos filtros aplicados.'
                : 'Nenhuma falha foi registrada até o momento. Tudo funcionando!'}
            </p>
            {hasFilters && (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setStatusFilter('all')
                  setSearch('')
                }}
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <Search size={26} />
            </div>
            <p className="empty-state__title">Nenhum resultado</p>
            <p className="empty-state__text">Nenhum incidente corresponde à busca.</p>
            <button type="button" className="btn btn--ghost" onClick={() => setSearch('')}>
              Limpar busca
            </button>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Incidente</th>
                  <th>Monitor</th>
                  <th>Status</th>
                  <th>Início</th>
                  <th>Resolução</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((incident) => (
                  <tr key={incident.id}>
                    <td>
                      <div className="cell-primary">
                        <span
                          className={`cell-primary__icon${
                            incident.status === 'resolved' ? '' : ' cell-primary__icon--red'
                          }`}
                        >
                          <AlertTriangle size={17} />
                        </span>
                        <div>
                          <span className="cell-primary__name">{incident.reason}</span>
                          <span className="cell-primary__hint">id {shortId(incident.id)}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Link to={`/monitors/${incident.monitor_id}`} className="cell-mono">
                        {shortId(incident.monitor_id)}
                      </Link>
                    </td>
                    <td>
                      <StatusBadge kind="incident" status={incident.status} />
                    </td>
                    <td>
                      <span className="cell-muted" title={formatDateTime(incident.started_at)}>
                        {formatRelative(incident.started_at)}
                      </span>
                    </td>
                    <td>
                      <span
                        className="cell-muted"
                        title={incident.resolved_at ? formatDateTime(incident.resolved_at) : undefined}
                      >
                        {incident.resolved_at ? formatDateTime(incident.resolved_at) : '—'}
                      </span>
                    </td>
                    <td>
                      <div className="cell-actions">
                        {incident.status === 'open' && (
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => handleUpdate(incident.id, 'investigating')}
                            disabled={updateStatus.isPending}
                          >
                            <Eye size={14} />
                            Investigar
                          </button>
                        )}
                        {incident.status !== 'resolved' && (
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => handleUpdate(incident.id, 'resolved')}
                            disabled={updateStatus.isPending}
                          >
                            <CheckCircle2 size={14} />
                            Resolver
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !error && (data?.total ?? 0) > 0 && (
          <div className="panel__footer">
            <span className="pagination__info">
              Página {page} de {totalPages} • {data?.total} incidente(s)
            </span>
            <div className="pagination">
              <button
                type="button"
                className="pagination__btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Página anterior"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`pagination__btn${p === page ? ' pagination__btn--current' : ''}`}
                  onClick={() => setPage(p)}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="pagination__btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label="Próxima página"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  )
}
