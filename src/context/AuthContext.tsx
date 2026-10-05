import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { api } from '../services/api'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  token: string | null
  completeLogin: (accessToken: string, refreshToken: string) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (token) {
      api
        .get('/auth/me')
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          setToken(null)
          setUser(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setUser(null)
      setIsLoading(false)
    }
  }, [token])

  const completeLogin = useCallback((accessToken: string, refreshToken: string) => {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    setToken(accessToken)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, completeLogin, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
