import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="layout">
      <nav className="sidebar">
        <h1>ForgeOps</h1>
        <ul>
          <li>
            <NavLink to="/" end>Dashboard</NavLink>
          </li>
          <li>
            <NavLink to="/monitors">Monitors</NavLink>
          </li>
          <li>
            <NavLink to="/incidents">Incidents</NavLink>
          </li>
        </ul>
        <div className="user-info">
          <span>{user?.name}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
