import { AlertTriangle, Flame, LogIn } from 'lucide-react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const [searchParams] = useSearchParams()
  const { user, isLoading } = useAuth()
  const oauthError = searchParams.get('error')

  if (!isLoading && user) {
    return <Navigate to="/" replace />
  }

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__brand">
          <span className="login-card__mark" aria-hidden="true">
            <Flame size={28} />
          </span>
          <h1 className="login-card__title">ForgeOps</h1>
        </div>
        <p className="login-card__subtitle">Entre para acompanhar a saúde das suas APIs.</p>

        <div className="login-form">
          {oauthError && (
            <div className="alert alert--error" role="alert">
              <AlertTriangle size={16} />
              Não foi possível concluir o login com o Google. Tente novamente.
            </div>
          )}

          <button type="button" className="btn btn--primary" onClick={handleGoogleLogin}>
            <LogIn size={16} />
            Entrar com Google
          </button>
        </div>

        <p className="login-card__footer">
          ForgeOps v1.0.0 • Plataforma de observabilidade de APIs
        </p>
      </div>
    </div>
  )
}
