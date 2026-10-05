export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'viewer'
  is_active: boolean
  created_at: string
}

export interface Monitor {
  id: string
  name: string
  url: string
  method: string
  interval_seconds: number
  timeout_seconds: number
  expected_status: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface MonitorCreate {
  name: string
  url: string
  method?: string
  interval_seconds?: number
  timeout_seconds?: number
  expected_status?: number
}

export interface MonitorUpdate {
  name?: string
  url?: string
  method?: string
  interval_seconds?: number
  timeout_seconds?: number
  expected_status?: number
  active?: boolean
}

export interface CheckResult {
  id: string
  monitor_id: string
  status: 'up' | 'down' | 'timeout' | 'error'
  http_status: number | null
  response_time_ms: number | null
  error_message: string | null
  checked_at: string
}

export interface Incident {
  id: string
  monitor_id: string
  status: 'open' | 'investigating' | 'resolved'
  reason: string
  started_at: string
  resolved_at: string | null
}

export interface DashboardSummary {
  total_monitors: number
  active_monitors: number
  total_checks: number
  total_incidents: number
  open_incidents: number
  avg_uptime: number
  avg_latency_ms: number
}

export interface UptimeResponse {
  monitor_id: string
  uptime_percentage: number
  total_checks: number
  successful_checks: number
  period_start: string
  period_end: string
}

export interface LatencyResponse {
  monitor_id: string
  avg_latency_ms: number
  p95_latency_ms: number
  p99_latency_ms: number
  min_latency_ms: number
  max_latency_ms: number
  total_checks: number
}

export interface CheckHistoryResponse {
  checks: CheckResult[]
  total: number
  page: number
  page_size: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}
