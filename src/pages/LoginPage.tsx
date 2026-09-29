import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Eye, EyeOff, Flame, Lock, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/')
    } catch {
      setError('Credenciais inválidas. Verifique seu e-mail e senha.')
    } finally {
      setSubmitting(false)
    }
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

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert--error" role="alert">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <div className="field">
            <label className="field__label" htmlFor="login-email">
              E-mail
            </label>
            <div className="input-group">
              <Mail size={17} />
              <input
                id="login-email"
                className="input"
                type="email"
                placeholder="voce@empresa.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="login-password">
              Senha
            </label>
            <div className="input-group">
              <Lock size={17} />
              <input
                id="login-password"
                className="input"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="input-group__action"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn--primary" disabled={submitting}>
            <Lock size={16} />
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="login-card__footer">
          ForgeOps v1.0.0 • Plataforma de observabilidade de APIs
        </p>
      </div>
    </div>
  )
}
