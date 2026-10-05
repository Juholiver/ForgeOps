import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { api } from '../services/api'

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockedGet = vi.mocked(api.get)

const testUser = {
  id: 'u1',
  name: 'Auth User',
  email: 'auth-user@example.com',
  role: 'viewer' as const,
  is_active: true,
  created_at: '2026-10-01T00:00:00Z',
}

function mockApiRoutes() {
  mockedGet.mockImplementation((url: string) => {
    if (url === '/auth/me') return Promise.resolve({ data: testUser })
    if (url === '/dashboard/summary')
      return Promise.resolve({
        data: {
          total_monitors: 0,
          active_monitors: 0,
          total_checks: 0,
          total_incidents: 0,
          open_incidents: 0,
          avg_uptime: 0,
          avg_latency_ms: 0,
        },
      })
    if (url === '/incidents')
      return Promise.resolve({ data: { items: [], total: 0, page: 1, page_size: 6 } })
    if (url === '/monitors')
      return Promise.resolve({ data: { items: [], total: 0, page: 1, page_size: 5 } })
    return Promise.resolve({ data: {} })
  })
}

describe('auth flows', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    mockApiRoutes()
    window.history.pushState({}, '', '/')
  })

  it('redirects unauthenticated users from a protected route to /login', async () => {
    window.history.pushState({}, '', '/monitors')

    render(<App />)

    expect(await screen.findByText('Entrar com Google')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
  })

  it('recovers an existing session via /auth/me and skips the login page', async () => {
    localStorage.setItem('access_token', 'existing-token')
    window.history.pushState({}, '', '/login')

    render(<App />)

    await waitFor(() => expect(window.location.pathname).toBe('/'))
    expect(mockedGet).toHaveBeenCalledWith('/auth/me')
    expect(screen.queryByText('Entrar com Google')).not.toBeInTheDocument()
  })

  it('stores tokens from the OAuth callback and lands on the dashboard', async () => {
    window.history.pushState({}, '', '/auth/callback?access_token=acc&refresh_token=ref')

    render(<App />)

    await waitFor(() => expect(localStorage.getItem('access_token')).toBe('acc'))
    await waitFor(() => expect(localStorage.getItem('refresh_token')).toBe('ref'))
    await waitFor(() => expect(window.location.pathname).toBe('/'))
    expect(screen.queryByText('Entrar com Google')).not.toBeInTheDocument()
  })

  it('sends the user back to /login with an error when the callback has no tokens', async () => {
    window.history.pushState({}, '', '/auth/callback')

    render(<App />)

    expect(
      await screen.findByText(/Não foi possível concluir o login com o Google/),
    ).toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
  })

  it('shows the login error when Google returns an error param', async () => {
    window.history.pushState({}, '', '/login?error=oauth')

    render(<App />)

    expect(
      await screen.findByText(/Não foi possível concluir o login com o Google/),
    ).toBeInTheDocument()
  })

  it('logs out from the user menu, clearing tokens and returning to /login', async () => {
    localStorage.setItem('access_token', 'existing-token')
    localStorage.setItem('refresh_token', 'existing-refresh')
    const user = userEvent.setup()

    render(<App />)

    await waitFor(() => expect(window.location.pathname).toBe('/'))
    await screen.findByText('Auth User')

    await user.click(screen.getByRole('button', { name: /Auth User/ }))
    await user.click(await screen.findByText('Sair da conta'))

    await waitFor(() => expect(window.location.pathname).toBe('/login'))
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
    expect(await screen.findByText('Entrar com Google')).toBeInTheDocument()
  })
})
