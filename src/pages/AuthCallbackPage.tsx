import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { completeLogin } = useAuth()

  useEffect(() => {
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')

    if (accessToken && refreshToken) {
      completeLogin(accessToken, refreshToken)
      navigate('/', { replace: true })
    } else {
      navigate('/login?error=oauth', { replace: true })
    }
  }, [searchParams, completeLogin, navigate])

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="loading-state" role="status">
          <span className="spinner" aria-hidden="true" />
          Autenticando com o Google…
        </div>
      </div>
    </div>
  )
}
