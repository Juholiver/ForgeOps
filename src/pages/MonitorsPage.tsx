import { useEffect, useMemo, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  Monitor,
  Pause,
  Play,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { StatusBadge } from '../components/StatusBadge'
import { Modal } from '../components/Modal'
import { useMonitors, useCreateMonitor, useToggleMonitor, useDeleteMonitor } from '../hooks/useMonitors'
import type { MonitorCreate } from '../types'
import { formatInterval, formatRelative } from '../lib/format'

const PAGE_SIZE = 8
const FETCH_LIMIT = 100

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

const EMPTY_FORM: MonitorCreate = {
  name: '',
  url: '',
  method: 'GET',
  interval_seconds: 60,
  timeout_seconds: 30,
  expected_status: 200,
}

export function MonitorsPage() {
  const location = useLocation()
  const state = location.state as { search?: string; openForm?: boolean } | null

  const { data, isLoading, error } = useMonitors(1, FETCH_LIMIT)
  const createMonitor = useCreateMonitor()
  const toggleMonitor = useToggleMonitor()
  const deleteMonitor = useDeleteMonitor()

  const [search, setSearch] = useState(state?.search ?? '')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(state?.openForm ?? false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [form, setForm] = useState<MonitorCreate>(EMPTY_FORM)

  useEffect(() => {
    if (state?.search !== undefined) setSearch(state.search)
    if (state?.openForm) setShowCreate(true)
  }, [location.key])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, methodFilter])

  const items = data?.items ?? []
  const activeCount = items.filter((m) => m.active).length

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return items.filter((m) => {
      if (term && !m.name.toLowerCase().includes(term) && !m.url.toLowerCase().includes(term)) return false
      if (statusFilter === 'active' && !m.active) return false
      if (statusFilter === 'inactive' && m.active) return false
      if (methodFilter !== 'all' && m.method !== methodFilter) return false
      return true
    })
  }, [items, search, statusFilter, methodFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const hasFilters = search.trim() !== '' || statusFilter !== 'all' || methodFilter !== 'all'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMonitor.mutate(form, {
      onSuccess: () => {
        setShowCreate(false)
        setForm(EMPTY_FORM)
      },
    })
  }

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setMethodFilter('all')
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteMonitor.mutate(deleteTarget, { onSuccess: () => setDeleteTarget(null) })
  }

  const deleteTargetName = items.find((m) => m.id === deleteTarget)?.name ?? ''

  return (
    <>
      <PageHeader
        icon={Monitor}
        title="Monitores"
        subtitle="Configure e acompanhe a saúde de cada endpoint monitorado."
        actions={
          <button type="button" className="btn btn--primary" onClick={() => setShowCreate(true)}>
            <Plus size={17} />
            Novo monitor
          </button>
        }
      />

      <div className="stats-grid">
        <StatCard
          icon={Monitor}
          label="Total de monitores"
          value={String(data?.total ?? 0)}
          hint="endpoints cadastrados"
          accent="blue"
        />
        <StatCard
          icon={CheckCircle2}
          label="Ativos"
          value={String(activeCount)}
          hint="verificando regularmente"
          accent="green"
        />
        <StatCard
          icon={Pause}
          label="Inativos"
          value={String(items.length - activeCount)}
          hint="verificação pausada"
          accent="amber"
        />
        <StatCard
          icon={Clock}
          label="Exibindo"
          value={`${filtered.length}`}
          hint={hasFilters ? 'resultados filtrados' : 'nesta página de dados'}
          accent="purple"
        />
      </div>

      <section className="panel">
        <div className="panel__header">
          <div className="panel__toolbar">
            <span className="search-field">
              <Search size={16} />
              <input
                className="input input--search"
                placeholder="Buscar por nome ou URL…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar monitores"
              />
            </span>
            <select
              className="select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              aria-label="Filtrar por status"
            >
              <option value="all">Todos os status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
            <select
              className="select"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              aria-label="Filtrar por método"
            >
              <option value="all">Todos os métodos</option>
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <span className="pagination__info">
            {filtered.length} de {data?.total ?? 0} monitor(es)
          </span>
        </div>

        {isLoading ? (
          <div className="panel__body">
            <div className="skeleton skeleton--row" />
            <div className="skeleton skeleton--row" />
            <div className="skeleton skeleton--row" />
            <div className="skeleton skeleton--row" />
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <AlertTriangle size={26} />
            </div>
            <p className="empty-state__title">Erro ao carregar monitores</p>
            <p className="empty-state__text">Não foi possível listar os monitores. Tente novamente.</p>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <Monitor size={26} />
            </div>
            <p className="empty-state__title">Nenhum monitor ainda</p>
            <p className="empty-state__text">
              Crie seu primeiro monitor para começar a verificar a disponibilidade das suas APIs.
            </p>
            <button type="button" className="btn btn--primary" onClick={() => setShowCreate(true)}>
              <Plus size={16} />
              Criar primeiro monitor
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <Search size={26} />
            </div>
            <p className="empty-state__title">Nenhum resultado</p>
            <p className="empty-state__text">Nenhum monitor corresponde aos filtros aplicados.</p>
            <button type="button" className="btn btn--ghost" onClick={clearFilters}>
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Monitor</th>
                  <th>URL</th>
                  <th>Método</th>
                  <th>Intervalo</th>
                  <th>Status</th>
                  <th>Criado</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((monitor) => (
                  <tr key={monitor.id}>
                    <td>
                      <div className="cell-primary">
                        <span className={`cell-primary__icon${monitor.active ? '' : ' cell-primary__icon--red'}`}>
                          <Monitor size={17} />
                        </span>
                        <div>
                          <Link to={`/monitors/${monitor.id}`} className="cell-primary__name">
                            {monitor.name}
                          </Link>
                          <span className="cell-primary__hint">a cada {formatInterval(monitor.interval_seconds)}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <a
                        className="cell-url"
                        href={monitor.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={monitor.url}
                      >
                        <ExternalLink size={13} />
                        <span>{monitor.url}</span>
                      </a>
                    </td>
                    <td>
                      <span className={`method-badge method-badge--${monitor.method}`}>{monitor.method}</span>
                    </td>
                    <td>
                      <span className="cell-muted">
                        <Clock size={14} />
                        {formatInterval(monitor.interval_seconds)}
                      </span>
                    </td>
                    <td>
                      <StatusBadge kind={monitor.active ? 'active' : 'inactive'} status="" />
                    </td>
                    <td>
                      <span className="cell-muted">{formatRelative(monitor.created_at)}</span>
                    </td>
                    <td>
                      <div className="cell-actions">
                        <Link
                          to={`/monitors/${monitor.id}`}
                          className="action-btn action-btn--view"
                          aria-label={`Ver detalhes de ${monitor.name}`}
                          title="Ver detalhes"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          type="button"
                          className="action-btn action-btn--toggle"
                          onClick={() => toggleMonitor.mutate(monitor.id)}
                          disabled={toggleMonitor.isPending}
                          aria-label={monitor.active ? `Pausar ${monitor.name}` : `Ativar ${monitor.name}`}
                          title={monitor.active ? 'Pausar' : 'Ativar'}
                        >
                          {monitor.active ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                        <button
                          type="button"
                          className="action-btn action-btn--danger"
                          onClick={() => setDeleteTarget(monitor.id)}
                          aria-label={`Excluir ${monitor.name}`}
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !error && filtered.length > 0 && (
          <div className="panel__footer">
            <span className="pagination__info">
              Página {page} de {totalPages} • {filtered.length} monitor(es)
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
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, page - 3), Math.max(0, page - 3) + 5)
                .map((p) => (
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

      <Modal
        open={showCreate}
        onClose={() => {
          setShowCreate(false)
          createMonitor.reset()
        }}
        title="Novo monitor"
        icon={Plus}
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setShowCreate(false)}>
              Cancelar
            </button>
            <button type="submit" form="create-monitor-form" className="btn btn--primary" disabled={createMonitor.isPending}>
              <Plus size={16} />
              {createMonitor.isPending ? 'Criando…' : 'Criar monitor'}
            </button>
          </>
        }
      >
        <form id="create-monitor-form" onSubmit={handleSubmit} className="form-grid">
          {createMonitor.isError && (
            <div className="alert alert--error field--full" role="alert">
              <AlertTriangle size={16} />
              Não foi possível criar o monitor. Verifique os dados informados.
            </div>
          )}
          <div className="field field--full">
            <label className="field__label" htmlFor="monitor-name">
              Nome
            </label>
            <input
              id="monitor-name"
              className="input"
              placeholder="Ex.: API de pagamentos"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="field field--full">
            <label className="field__label" htmlFor="monitor-url">
              URL
            </label>
            <input
              id="monitor-url"
              className="input"
              type="url"
              placeholder="https://api.exemplo.com/health"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="monitor-method">
              Método
            </label>
            <select
              id="monitor-method"
              className="select"
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value })}
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="monitor-status">
              Status esperado
            </label>
            <input
              id="monitor-status"
              className="input"
              type="number"
              min={100}
              max={599}
              value={form.expected_status}
              onChange={(e) => setForm({ ...form, expected_status: Number(e.target.value) })}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="monitor-interval">
              Intervalo (segundos)
            </label>
            <input
              id="monitor-interval"
              className="input"
              type="number"
              min={10}
              value={form.interval_seconds}
              onChange={(e) => setForm({ ...form, interval_seconds: Number(e.target.value) })}
              required
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="monitor-timeout">
              Timeout (segundos)
            </label>
            <input
              id="monitor-timeout"
              className="input"
              type="number"
              min={1}
              value={form.timeout_seconds}
              onChange={(e) => setForm({ ...form, timeout_seconds: Number(e.target.value) })}
              required
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Excluir monitor"
        icon={Trash2}
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={confirmDelete}
              disabled={deleteMonitor.isPending}
            >
              <Trash2 size={16} />
              {deleteMonitor.isPending ? 'Excluindo…' : 'Excluir definitivamente'}
            </button>
          </>
        }
      >
        <p className="confirm-text">
          Tem certeza que deseja excluir o monitor <strong>{deleteTargetName}</strong>? O histórico de checks e
          incidentes associados deixará de ser consultado por esta tela. Essa ação não pode ser desfeita.
        </p>
        {deleteMonitor.isError && (
          <div className="alert alert--error" role="alert">
            <AlertTriangle size={16} />
            Falha ao excluir o monitor.
          </div>
        )}
      </Modal>
    </>
  )
}
