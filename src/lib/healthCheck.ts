import type { CheckResult, Monitor } from '../types'

interface CheckOutcome {
  status: CheckResult['status']
  http_status: number | null
  response_time_ms: number | null
  error_message: string | null
}

function buildResult(monitor: Monitor, outcome: CheckOutcome, now: Date): CheckResult {
  return {
    id: crypto.randomUUID(),
    monitor_id: monitor.id,
    status: outcome.status,
    http_status: outcome.http_status,
    response_time_ms: outcome.response_time_ms,
    error_message: outcome.error_message,
    checked_at: now.toISOString(),
  }
}

async function probeReachable(monitor: Monitor, timeoutMs: number): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    await fetch(monitor.url, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
      redirect: 'follow',
      signal: controller.signal,
    })
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

function describeError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return 'Não foi possível conectar'
}

export async function runHealthCheck(monitor: Monitor, now = new Date()): Promise<CheckResult> {
  const started = performance.now()
  const timeoutMs = Math.max(1, monitor.timeout_seconds) * 1000
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(monitor.url, {
      method: monitor.method,
      cache: 'no-store',
      redirect: 'follow',
      signal: controller.signal,
    })
    const elapsed = Math.round(performance.now() - started)
    if (response.status === monitor.expected_status) {
      return buildResult(
        monitor,
        {
          status: 'up',
          http_status: response.status,
          response_time_ms: elapsed,
          error_message: null,
        },
        now,
      )
    }
    return buildResult(
      monitor,
      {
        status: 'down',
        http_status: response.status,
        response_time_ms: elapsed,
        error_message: `HTTP ${response.status} (esperado ${monitor.expected_status})`,
      },
      now,
    )
  } catch (error) {
    if (controller.signal.aborted) {
      return buildResult(
        monitor,
        {
          status: 'timeout',
          http_status: null,
          response_time_ms: null,
          error_message: `Tempo esgotado (${monitor.timeout_seconds}s)`,
        },
        now,
      )
    }

    // A requisição pode ter falhado por CORS em vez de indisponibilidade.
    // Uma segunda tentativa em modo no-cors responde se o host está no ar.
    const reachable = await probeReachable(monitor, timeoutMs)
    const elapsed = Math.round(performance.now() - started)
    if (reachable) {
      return buildResult(
        monitor,
        {
          status: 'up',
          http_status: null,
          response_time_ms: elapsed,
          error_message: null,
        },
        now,
      )
    }
    return buildResult(
      monitor,
      {
        status: 'down',
        http_status: null,
        response_time_ms: null,
        error_message: describeError(error),
      },
      now,
    )
  } finally {
    clearTimeout(timer)
  }
}
