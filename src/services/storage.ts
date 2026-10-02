import {
  applyCheckToIncidents,
  computeDashboardSummary,
  computeIncidentSummary,
  computeLatency,
  computeUptime,
  isMonitorDue,
  paginate,
  withinDays,
} from '../lib/stats'
import type {
  CheckHistoryResponse,
  CheckResult,
  DashboardSummary,
  Incident,
  LatencyResponse,
  Monitor,
  MonitorCreate,
  PaginatedResponse,
  UptimeResponse,
} from '../types'

const STORAGE_KEY = 'forgeops.db.v1'
const DB_VERSION = 1 as const
const DAY_MS = 86_400_000
const MAX_CHECKS = 5_000

interface Database {
  version: typeof DB_VERSION
  monitors: Monitor[]
  checks: CheckResult[]
  incidents: Incident[]
}

let memoryFallback: string | null = null

function loadRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return memoryFallback
  }
}

function persist(raw: string) {
  memoryFallback = raw
  try {
    localStorage.setItem(STORAGE_KEY, raw)
  } catch {
    // Quota estourada: poda o histórico e tenta gravar de novo.
    try {
      const db = JSON.parse(raw) as Database
      db.checks = db.checks.slice(-1_000)
      const pruned = JSON.stringify(db)
      memoryFallback = pruned
      localStorage.setItem(STORAGE_KEY, pruned)
    } catch {
      // Sem localStorage utilizável: segue apenas em memória.
    }
  }
}

function writeDatabase(db: Database) {
  if (db.checks.length > MAX_CHECKS) {
    db.checks = db.checks.slice(-MAX_CHECKS)
  }
  persist(JSON.stringify(db))
}

function readDatabase(): Database {
  const raw = loadRaw()
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Database
      if (parsed && parsed.version === DB_VERSION && Array.isArray(parsed.monitors)) {
        return parsed
      }
    } catch {
      // dados corrompidos → recria com seed
    }
  }
  const db = seedDatabase()
  writeDatabase(db)
  return db
}

export function resetDatabase() {
  memoryFallback = null
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignora
  }
}

export function listMonitors(page = 1, pageSize = 20): PaginatedResponse<Monitor> {
  const monitors = [...readDatabase().monitors].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  )
  return paginate(monitors, page, pageSize)
}

export function getMonitor(id: string): Monitor | undefined {
  return readDatabase().monitors.find((monitor) => monitor.id === id)
}

export function createMonitor(input: MonitorCreate): Monitor {
  const db = readDatabase()
  const now = new Date().toISOString()
  const monitor: Monitor = {
    id: crypto.randomUUID(),
    name: input.name,
    url: input.url,
    method: input.method ?? 'GET',
    interval_seconds: input.interval_seconds ?? 60,
    timeout_seconds: input.timeout_seconds ?? 30,
    expected_status: input.expected_status ?? 200,
    active: true,
    created_at: now,
    updated_at: now,
  }
  db.monitors.push(monitor)
  writeDatabase(db)
  return monitor
}

export function toggleMonitor(id: string): Monitor {
  const db = readDatabase()
  const monitor = db.monitors.find((item) => item.id === id)
  if (!monitor) throw new Error('Monitor não encontrado')
  monitor.active = !monitor.active
  monitor.updated_at = new Date().toISOString()
  writeDatabase(db)
  return monitor
}

export function deleteMonitor(id: string) {
  const db = readDatabase()
  db.monitors = db.monitors.filter((monitor) => monitor.id !== id)
  db.checks = db.checks.filter((check) => check.monitor_id !== id)
  db.incidents = db.incidents.filter((incident) => incident.monitor_id !== id)
  writeDatabase(db)
}

export function recordCheck(check: CheckResult) {
  const db = readDatabase()
  db.checks.push(check)
  db.incidents = applyCheckToIncidents(
    db.incidents,
    check,
    new Date(check.checked_at).getTime(),
  )
  writeDatabase(db)
}

export function getDueMonitors(now: number): Monitor[] {
  const db = readDatabase()
  const lastByMonitor = new Map<string, number>()
  for (const check of db.checks) {
    const at = new Date(check.checked_at).getTime()
    const previous = lastByMonitor.get(check.monitor_id)
    if (previous === undefined || at > previous) {
      lastByMonitor.set(check.monitor_id, at)
    }
  }
  return db.monitors.filter((monitor) =>
    isMonitorDue(monitor, lastByMonitor.get(monitor.id) ?? null, now),
  )
}

export function getDashboardSummary(): DashboardSummary {
  const db = readDatabase()
  return computeDashboardSummary(db.monitors, db.checks, db.incidents, 7, Date.now())
}

export function getUptime(monitorId: string, days: number): UptimeResponse {
  return computeUptime(monitorId, readDatabase().checks, days, Date.now())
}

export function getLatency(monitorId: string, days: number): LatencyResponse {
  return computeLatency(monitorId, readDatabase().checks, days, Date.now())
}

export function getCheckHistory(
  monitorId: string,
  page: number,
  pageSize: number,
  days: number,
): CheckHistoryResponse {
  const now = Date.now()
  const checks = readDatabase()
    .checks.filter(
      (check) => check.monitor_id === monitorId && withinDays(check.checked_at, days, now),
    )
    .sort((a, b) => b.checked_at.localeCompare(a.checked_at))
  const paged = paginate(checks, page, pageSize)
  return {
    checks: paged.items,
    total: paged.total,
    page: paged.page,
    page_size: paged.page_size,
  }
}

export function listIncidents(
  page = 1,
  pageSize = 20,
  status?: Incident['status'],
): PaginatedResponse<Incident> {
  let incidents = readDatabase().incidents
  if (status) {
    incidents = incidents.filter((incident) => incident.status === status)
  }
  incidents = [...incidents].sort((a, b) => b.started_at.localeCompare(a.started_at))
  return paginate(incidents, page, pageSize)
}

export function getIncidentSummary() {
  return computeIncidentSummary(readDatabase().incidents)
}

export function updateIncidentStatus(id: string, status: Incident['status']): Incident {
  const db = readDatabase()
  let updated: Incident | undefined
  db.incidents = db.incidents.map((incident) => {
    if (incident.id !== id) return incident
    updated = {
      ...incident,
      status,
      resolved_at: status === 'resolved' ? new Date().toISOString() : null,
    }
    return updated
  })
  if (!updated) throw new Error('Incidente não encontrado')
  writeDatabase(db)
  return updated
}

function makeMonitor(
  name: string,
  url: string,
  intervalSeconds: number,
  timeoutSeconds: number,
  now: number,
): Monitor {
  return {
    id: crypto.randomUUID(),
    name,
    url,
    method: 'GET',
    interval_seconds: intervalSeconds,
    timeout_seconds: timeoutSeconds,
    expected_status: 200,
    active: true,
    created_at: new Date(now - DAY_MS * 7).toISOString(),
    updated_at: new Date(now - Math.floor(Math.random() * 6) * 3_600_000).toISOString(),
  }
}

function makeSeedCheck(monitor: Monitor, at: number, fail: boolean, roll: number): CheckResult {
  const base = 60 + Math.floor(Math.random() * 160)
  const build = (
    status: CheckResult['status'],
    httpStatus: number | null,
    latency: number | null,
    message: string | null,
  ): CheckResult => ({
    id: crypto.randomUUID(),
    monitor_id: monitor.id,
    status,
    http_status: httpStatus,
    response_time_ms: latency,
    error_message: message,
    checked_at: new Date(at).toISOString(),
  })

  if (!fail) {
    const spike = Math.random() < 0.05 ? 300 : 0
    return build('up', 200, base + spike, null)
  }
  if (roll < 0.6) {
    return build(
      'down',
      503,
      base + 40,
      `HTTP 503 (esperado ${monitor.expected_status})`,
    )
  }
  if (roll < 0.85) {
    return build('timeout', null, null, `Tempo esgotado (${monitor.timeout_seconds}s)`)
  }
  return build('error', null, null, 'Não foi possível conectar')
}

function seedDatabase(): Database {
  const now = Date.now()
  const monitors = [
    makeMonitor('API do GitHub', 'https://api.github.com', 60, 10, now),
    makeMonitor(
      'JSONPlaceholder',
      'https://jsonplaceholder.typicode.com/todos/1',
      120,
      15,
      now,
    ),
    makeMonitor('Example.com', 'https://example.com', 300, 15, now),
  ]

  const checks: CheckResult[] = []
  const stepMs = 30 * 60 * 1000
  for (const monitor of monitors) {
    let downRemaining = 0
    for (let at = now - DAY_MS * 7; at <= now; at += stepMs) {
      let fail = false
      if (downRemaining > 0) {
        fail = true
        downRemaining -= 1
      } else if (Math.random() < 0.04) {
        fail = true
        downRemaining = Math.floor(Math.random() * 2)
      }
      checks.push(makeSeedCheck(monitor, at, fail, Math.random()))
    }
  }

  let incidents: Incident[] = []
  for (const monitor of monitors) {
    const monitorChecks = checks
      .filter((check) => check.monitor_id === monitor.id)
      .sort((a, b) => a.checked_at.localeCompare(b.checked_at))
    for (const check of monitorChecks) {
      incidents = applyCheckToIncidents(incidents, check, new Date(check.checked_at).getTime())
    }
  }

  return { version: DB_VERSION, monitors, checks, incidents }
}
