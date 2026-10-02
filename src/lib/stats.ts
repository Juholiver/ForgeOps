import type {
  CheckResult,
  DashboardSummary,
  Incident,
  LatencyResponse,
  Monitor,
  PaginatedResponse,
  UptimeResponse,
} from '../types'

const DAY_MS = 86_400_000

export interface IncidentSummary {
  total: number
  open: number
  investigating: number
  resolved: number
}

export function paginate<T>(items: T[], page: number, pageSize: number): PaginatedResponse<T> {
  const safePage = Math.max(1, page)
  const safeSize = Math.max(1, pageSize)
  const start = (safePage - 1) * safeSize
  return {
    items: items.slice(start, start + safeSize),
    total: items.length,
    page: safePage,
    page_size: safeSize,
  }
}

export function withinDays(iso: string, days: number, now: number): boolean {
  return now - new Date(iso).getTime() <= days * DAY_MS
}

function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0
  const index = Math.ceil((p / 100) * sortedAsc.length) - 1
  return sortedAsc[Math.min(sortedAsc.length - 1, Math.max(0, index))]
}

function windowedChecks(checks: CheckResult[], days: number, now: number): CheckResult[] {
  return checks.filter((check) => withinDays(check.checked_at, days, now))
}

export function computeUptime(
  monitorId: string,
  checks: CheckResult[],
  days: number,
  now: number,
): UptimeResponse {
  const inWindow = windowedChecks(checks, days, now).filter(
    (check) => check.monitor_id === monitorId,
  )
  const successful = inWindow.filter((check) => check.status === 'up').length
  return {
    monitor_id: monitorId,
    uptime_percentage:
      inWindow.length === 0 ? 0 : Math.round((successful / inWindow.length) * 10_000) / 100,
    total_checks: inWindow.length,
    successful_checks: successful,
    period_start: new Date(now - days * DAY_MS).toISOString(),
    period_end: new Date(now).toISOString(),
  }
}

export function computeLatency(
  monitorId: string,
  checks: CheckResult[],
  days: number,
  now: number,
): LatencyResponse {
  const inWindow = windowedChecks(checks, days, now).filter(
    (check) => check.monitor_id === monitorId,
  )
  const values = inWindow
    .map((check) => check.response_time_ms)
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b)

  if (values.length === 0) {
    return {
      monitor_id: monitorId,
      avg_latency_ms: 0,
      p95_latency_ms: 0,
      p99_latency_ms: 0,
      min_latency_ms: 0,
      max_latency_ms: 0,
      total_checks: inWindow.length,
    }
  }

  const sum = values.reduce((acc, value) => acc + value, 0)
  return {
    monitor_id: monitorId,
    avg_latency_ms: Math.round(sum / values.length),
    p95_latency_ms: percentile(values, 95),
    p99_latency_ms: percentile(values, 99),
    min_latency_ms: values[0],
    max_latency_ms: values[values.length - 1],
    total_checks: inWindow.length,
  }
}

export function computeDashboardSummary(
  monitors: Monitor[],
  checks: CheckResult[],
  incidents: Incident[],
  days: number,
  now: number,
): DashboardSummary {
  const inWindow = windowedChecks(checks, days, now)
  const successful = inWindow.filter((check) => check.status === 'up').length
  const latencies = inWindow
    .map((check) => check.response_time_ms)
    .filter((value): value is number => value !== null)
  const avgLatency =
    latencies.length === 0
      ? 0
      : Math.round(latencies.reduce((acc, value) => acc + value, 0) / latencies.length)

  return {
    total_monitors: monitors.length,
    active_monitors: monitors.filter((monitor) => monitor.active).length,
    total_checks: checks.length,
    total_incidents: incidents.length,
    open_incidents: incidents.filter((incident) => incident.status !== 'resolved').length,
    avg_uptime:
      inWindow.length === 0 ? 0 : Math.round((successful / inWindow.length) * 10_000) / 100,
    avg_latency_ms: avgLatency,
  }
}

export function computeIncidentSummary(incidents: Incident[]): IncidentSummary {
  return {
    total: incidents.length,
    open: incidents.filter((incident) => incident.status === 'open').length,
    investigating: incidents.filter((incident) => incident.status === 'investigating').length,
    resolved: incidents.filter((incident) => incident.status === 'resolved').length,
  }
}

export function applyCheckToIncidents(
  incidents: Incident[],
  check: CheckResult,
  now: number,
): Incident[] {
  const unresolvedIds = new Set(
    incidents
      .filter(
        (incident) => incident.monitor_id === check.monitor_id && incident.status !== 'resolved',
      )
      .map((incident) => incident.id),
  )

  if (check.status === 'up') {
    if (unresolvedIds.size === 0) return incidents
    const resolvedAt = new Date(now).toISOString()
    return incidents.map((incident) =>
      unresolvedIds.has(incident.id)
        ? { ...incident, status: 'resolved' as const, resolved_at: resolvedAt }
        : incident,
    )
  }

  if (unresolvedIds.size > 0) return incidents

  return [
    ...incidents,
    {
      id: crypto.randomUUID(),
      monitor_id: check.monitor_id,
      status: 'open',
      reason: check.error_message ?? `Falha "${check.status}"`,
      started_at: check.checked_at,
      resolved_at: null,
    },
  ]
}

export function isMonitorDue(monitor: Monitor, lastCheckAt: number | null, now: number): boolean {
  if (!monitor.active) return false
  if (lastCheckAt === null) return true
  return now - lastCheckAt >= monitor.interval_seconds * 1000
}
