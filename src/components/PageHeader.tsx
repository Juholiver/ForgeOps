import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  icon: LucideIcon
  iconVariant?: 'blue' | 'green' | 'red' | 'purple'
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function PageHeader({ icon: Icon, iconVariant = 'blue', title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header__title">
        <div className={`page-header__icon${iconVariant === 'blue' ? '' : ` page-header__icon--${iconVariant}`}`}>
          <Icon size={26} strokeWidth={2} />
        </div>
        <div>
          <h1>{title}</h1>
          {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  )
}
