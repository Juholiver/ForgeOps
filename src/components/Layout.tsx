import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  Bell,
  ChevronDown,
  Flame,
  LayoutDashboard,
  LogOut,
  Menu,
  Monitor as MonitorIcon,
  Search,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useIncidents } from '../hooks/useIncidents'
import { formatRelative, getInitials, shortId } from '../lib/format'

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  viewer: 'Visualizador',
}

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { data: incidents } = useIncidents(1, 6)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [bellOpen, setBellOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const closeMenus = () => {
    setBellOpen(false)
    setUserOpen(false)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    closeMenus()
    setSidebarOpen(false)
    navigate('/monitors', { state: { search } })
  }

  const handleLogout = () => {
    closeMenus()
    logout()
    navigate('/login')
  }

  const openIncidents = incidents?.items.filter((i) => i.status !== 'resolved') ?? []
  const bellItems = incidents?.items.slice(0, 5) ?? []

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>

      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      <nav className={`sidebar${sidebarOpen ? ' open' : ''}`} aria-label="Navegação principal">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            <Flame size={22} />
          </span>
          <div>
            <span className="brand__name">ForgeOps</span>
            <span className="brand__tagline">Monitore • Detecte • Resolva</span>
          </div>
          <button
            type="button"
            className="menu-toggle menu-toggle--close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        <p className="sidebar__section">Navegação</p>
        <ul className="sidebar__nav">
          <li>
            <NavLink to="/" end className="nav-item" onClick={() => setSidebarOpen(false)}>
              <LayoutDashboard size={19} />
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/monitors" className="nav-item" onClick={() => setSidebarOpen(false)}>
              <MonitorIcon size={19} />
              Monitores
            </NavLink>
          </li>
          <li>
            <NavLink to="/incidents" className="nav-item" onClick={() => setSidebarOpen(false)}>
              <AlertTriangle size={19} />
              Incidentes
              {openIncidents.length > 0 && (
                <span className="nav-item__badge" aria-label={`${openIncidents.length} incidentes abertos`}>
                  {openIncidents.length}
                </span>
              )}
            </NavLink>
          </li>
        </ul>

        <div className="sidebar__footer">
          <div className="system-status">
            <span className="system-status__dot" aria-hidden="true" />
            {openIncidents.length === 0 ? 'Todos os sistemas operacionais' : `${openIncidents.length} incidente(s) em aberto`}
          </div>
          <span className="system-status__version">v1.0.0</span>
        </div>
      </nav>

      <div className="app-main">
        <header className="topbar">
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>

          <form className="search" onSubmit={handleSearch} role="search">
            <Search size={17} className="search__icon" />
            <input
              ref={searchRef}
              className="search__input"
              placeholder="Buscar monitores..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar monitores"
            />
            <span className="search__kbd" aria-hidden="true">
              <kbd className="kbd">Ctrl</kbd>
              <kbd className="kbd">K</kbd>
            </span>
          </form>

          <div className="topbar__actions">
            <div className="user-menu">
              <button
                type="button"
                className="icon-btn"
                aria-label="Notificações de incidentes"
                aria-expanded={bellOpen}
                onClick={() => {
                  setBellOpen(!bellOpen)
                  setUserOpen(false)
                }}
              >
                <Bell size={19} />
                {openIncidents.length > 0 && <span className="icon-btn__dot" />}
              </button>
              {bellOpen && (
                <div className="dropdown dropdown--wide">
                  <div className="dropdown__header">
                    Incidentes recentes
                    <span className="badge badge--red">{openIncidents.length} aberto(s)</span>
                  </div>
                  {bellItems.length === 0 ? (
                    <p className="dropdown__empty">Nenhum incidente registrado.</p>
                  ) : (
                    bellItems.map((incident) => (
                      <Link
                        key={incident.id}
                        to={`/monitors/${incident.monitor_id}`}
                        className="dropdown__incident"
                        onClick={() => setBellOpen(false)}
                      >
                        <span className="dropdown__incident-reason">{incident.reason}</span>
                        <span className="dropdown__incident-time">
                          Monitor {shortId(incident.monitor_id)} • {formatRelative(incident.started_at)}
                        </span>
                      </Link>
                    ))
                  )}
                  <button
                    type="button"
                    className="dropdown__footer"
                    onClick={() => {
                      setBellOpen(false)
                      navigate('/incidents')
                    }}
                  >
                    Ver todos os incidentes
                  </button>
                </div>
              )}
            </div>

            <div className="user-menu">
              <button
                type="button"
                className="user-menu__trigger"
                aria-expanded={userOpen}
                onClick={() => {
                  setUserOpen(!userOpen)
                  setBellOpen(false)
                }}
              >
                <span className="avatar" aria-hidden="true">
                  {user ? getInitials(user.name) : '?'}
                </span>
                <span className="user-menu__meta">
                  <span className="user-menu__name">{user?.name ?? '—'}</span>
                  <span className="user-menu__role">
                    {user ? ROLE_LABEL[user.role] ?? user.role : ''}
                  </span>
                </span>
                <ChevronDown size={16} className="user-menu__chevron" />
              </button>
              {userOpen && (
                <div className="dropdown">
                  <div className="dropdown__header">
                    <span>{user?.email}</span>
                  </div>
                  <button
                    type="button"
                    className="dropdown__item"
                    onClick={() => {
                      setUserOpen(false)
                      navigate('/')
                    }}
                  >
                    <Activity size={16} />
                    Meu dashboard
                  </button>
                  <div className="dropdown__sep" />
                  <button
                    type="button"
                    className="dropdown__item dropdown__item--danger"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    Sair da conta
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {(bellOpen || userOpen) && <div className="dropdown-backdrop" onClick={closeMenus} />}

        <main className="content" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
