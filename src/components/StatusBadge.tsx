type Variant = 'green' | 'red' | 'amber' | 'blue' | 'purple' | 'gray'

const CHECK_STATUS: Record<string, { label: string; variant: Variant }> = {
  up: { label: 'Operacional', variant: 'green' },
  down: { label: 'Fora do ar', variant: 'red' },
  timeout: { label: 'Timeout', variant: 'amber' },
  error: { label: 'Erro', variant: 'red' },
}

const INCIDENT_STATUS: Record<string, { label: string; variant: Variant }> = {
  open: { label: 'Aberto', variant: 'red' },
  investigating: { label: 'Investigando', variant: 'amber' },
  resolved: { label: 'Resolvido', variant: 'green' },
}

function resolve(kind: 'check' | 'incident' | 'active' | 'inactive', status: string) {
  if (kind === 'active') return { label: 'Ativo', variant: 'green' as Variant }
  if (kind === 'inactive') return { label: 'Inativo', variant: 'gray' as Variant }
  const map = kind === 'check' ? CHECK_STATUS : INCIDENT_STATUS
  return map[status] ?? { label: status, variant: 'gray' as Variant }
}

interface StatusBadgeProps {
  kind: 'check' | 'incident' | 'active' | 'inactive'
  status: string
}

export function StatusBadge({ kind, status }: StatusBadgeProps) {
  const { label, variant } = resolve(kind, status)
  return (
    <span className={`badge badge--${variant}`}>
      <span className="badge__dot" aria-hidden="true" />
      {label}
    </span>
  )
}
