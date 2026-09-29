import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

type Accent = 'blue' | 'green' | 'red' | 'purple' | 'amber' | 'cyan'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string
  hint?: string
  accent?: Accent
  to?: string
}

export function StatCard({ icon: Icon, label, value, hint, accent = 'blue', to }: StatCardProps) {
  const body = (
    <>
      <div className="stat-card__icon">
        <Icon size={24} strokeWidth={2} />
      </div>
      <div className="stat-card__body">
        <span className="stat-card__label">{label}</span>
        <span className="stat-card__value">{value}</span>
        {hint && <span className="stat-card__hint">{hint}</span>}
      </div>
      {to && <ChevronRight size={18} className="stat-card__chevron" />}
    </>
  )

  const className = `stat-card stat-card--${accent}`

  if (to) {
    return (
      <Link to={to} className={className}>
        {body}
      </Link>
    )
  }

  return <div className={className}>{body}</div>
}
