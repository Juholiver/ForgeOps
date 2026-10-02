import { describe, expect, it } from 'vitest'
import {
  applyCheckToIncidents,
  computeDashboardSummary,
  computeIncidentSummary,
  computeLatency,
  computeUptime,
  isMonitorDue,
  paginate,
  withinDays,
} from './stats'
import type { CheckResult, Incident, Monitor } from '../types'

const NOW = Date.parse('2026-01-10T12:00:00.000Z')
const DAY_MS = 86_400_000

function makeMonitor(overrides: Partial<Monitor> = {}): Monitor {
  return {
    id: 'mon-1',
    name: 'API',
    url: 'https://api.example.com',
    method: 'GET',
    interval_seconds: 60,
    timeout_seconds: 30,
    expected_status: 200,
    active: true,
    created_at: new Date(NOW - DAY_MS).toISOString(),
    updated_at: new Date(NOW).toISOString(),
    ...overrides,
  }
}

function makeCheck(overrides: Partial<CheckResult> = {}): CheckResult {
  return {
    id: 'chk-1',
    monitor_id: 'mon-1',
    status: 'up',
    http_status: 200,
    response_time_ms: 100,
    error_message: null,
    checked_at: new Date(NOW).toISOString(),
    ...overrides,
  }
}

function makeIncident(overrides: Partial<Incident> = {}): Incident {
  return {
    id: 'inc-1',
    monitor_id: 'mon-1',
    status: 'open',
    reason: 'HTTP 503 (esperado 200)',
    started_at: new Date(NOW).toISOString(),
    resolved_at: null,
    ...overrides,
  }
}

describe('paginate', () => {
  it('fatia a página corretamente', () => {
    const items = [1, 2, 3, 4, 5]
    const result = paginate(items, 2, 2)
    expect(result.items).toEqual([3, 4])
    expect(result.total).toBe(5)
    expect(result.page).toBe(2)
    expect(result.page_size).toBe(2)
  })

  it('clampa página inválida para 1', () => {
    const result = paginate([1, 2], 0, 10)
    expect(result.items).toEqual([1, 2])
    expect(result.page).toBe(1)
  })
})

describe('withinDays', () => {
  it('aceita datas dentro da janela e rejeita fora', () => {
    expect(withinDays(new Date(NOW - DAY_MS).toISOString(), 7, NOW)).toBe(true)
    expect(withinDays(new Date(NOW - 8 * DAY_MS).toISOString(), 7, NOW)).toBe(false)
  })
})

describe('computeUptime', () => {
  it('calcula a porcentagem de checks up', () => {
    const checks = [
      makeCheck({ id: 'a' }),
      makeCheck({ id: 'b', status: 'down', http_status: 503 }),
      makeCheck({ id: 'c' }),
      makeCheck({ id: 'd' }),
    ]
    const result = computeUptime('mon-1', checks, 7, NOW)
    expect(result.uptime_percentage).toBe(75)
    expect(result.total_checks).toBe(4)
    expect(result.successful_checks).toBe(3)
  })

  it('ignora checks de outros monitores e fora da janela', () => {
    const checks = [
      makeCheck({ id: 'a', monitor_id: 'mon-2' }),
      makeCheck({ id: 'b', checked_at: new Date(NOW - 30 * DAY_MS).toISOString() }),
    ]
    const result = computeUptime('mon-1', checks, 7, NOW)
    expect(result.total_checks).toBe(0)
    expect(result.uptime_percentage).toBe(0)
  })
})

describe('computeLatency', () => {
  it('calcula média, percentis, mínimo e máximo', () => {
    const latencies = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    const checks = latencies.map((ms, index) =>
      makeCheck({ id: `chk-${index}`, response_time_ms: ms }),
    )
    const result = computeLatency('mon-1', checks, 7, NOW)
    expect(result.avg_latency_ms).toBe(55)
    expect(result.min_latency_ms).toBe(10)
    expect(result.max_latency_ms).toBe(100)
    expect(result.p95_latency_ms).toBe(100)
    expect(result.p99_latency_ms).toBe(100)
    expect(result.total_checks).toBe(10)
  })

  it('ignora latências nulas e retorna zeros sem dados', () => {
    const checks = [
      makeCheck({ id: 'a', response_time_ms: null }),
      makeCheck({ id: 'b', response_time_ms: 200 }),
    ]
    const result = computeLatency('mon-1', checks, 7, NOW)
    expect(result.avg_latency_ms).toBe(200)
    expect(result.total_checks).toBe(2)

    const empty = computeLatency('mon-1', [], 7, NOW)
    expect(empty.avg_latency_ms).toBe(0)
    expect(empty.total_checks).toBe(0)
  })
})

describe('computeDashboardSummary', () => {
  it('agrega monitores, checks e incidentes', () => {
    const monitors = [makeMonitor(), makeMonitor({ id: 'mon-2', active: false })]
    const checks = [
      makeCheck({ id: 'a' }),
      makeCheck({ id: 'b', status: 'down', http_status: 500, response_time_ms: 300 }),
      makeCheck({ id: 'c', checked_at: new Date(NOW - 30 * DAY_MS).toISOString() }),
    ]
    const incidents = [makeIncident(), makeIncident({ id: 'inc-2', status: 'resolved' })]
    const result = computeDashboardSummary(monitors, checks, incidents, 7, NOW)

    expect(result.total_monitors).toBe(2)
    expect(result.active_monitors).toBe(1)
    expect(result.total_checks).toBe(3)
    expect(result.total_incidents).toBe(2)
    expect(result.open_incidents).toBe(1)
    expect(result.avg_uptime).toBe(50)
    expect(result.avg_latency_ms).toBe(200)
  })
})

describe('computeIncidentSummary', () => {
  it('conta por status', () => {
    const incidents = [
      makeIncident({ id: 'a', status: 'open' }),
      makeIncident({ id: 'b', status: 'investigating' }),
      makeIncident({ id: 'c', status: 'resolved' }),
      makeIncident({ id: 'd', status: 'resolved' }),
    ]
    expect(computeIncidentSummary(incidents)).toEqual({
      total: 4,
      open: 1,
      investigating: 1,
      resolved: 2,
    })
  })
})

describe('applyCheckToIncidents', () => {
  it('abre um incidente na primeira falha', () => {
    const check = makeCheck({ status: 'down', error_message: 'HTTP 503 (esperado 200)' })
    const result = applyCheckToIncidents([], check, NOW)
    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('open')
    expect(result[0].reason).toBe('HTTP 503 (esperado 200)')
    expect(result[0].monitor_id).toBe('mon-1')
  })

  it('não duplica incidente enquanto houver um em aberto', () => {
    const incidents = [makeIncident()]
    const check = makeCheck({ status: 'timeout', error_message: 'Tempo esgotado (30s)' })
    expect(applyCheckToIncidents(incidents, check, NOW)).toHaveLength(1)
  })

  it('resolve incidentes abertos quando o check volta a ficar up', () => {
    const incidents = [makeIncident(), makeIncident({ id: 'inc-2', monitor_id: 'mon-2' })]
    const result = applyCheckToIncidents(incidents, makeCheck(), NOW)
    expect(result[0].status).toBe('resolved')
    expect(result[0].resolved_at).toBe(new Date(NOW).toISOString())
    expect(result[1].status).toBe('open')
  })

  it('devolve o mesmo array sem incidentes quando o check é up', () => {
    const incidents = [makeIncident({ status: 'resolved' })]
    expect(applyCheckToIncidents(incidents, makeCheck(), NOW)).toBe(incidents)
  })
})

describe('isMonitorDue', () => {
  it('fica devido por intervalo, por nunca ter check e por estar inativo', () => {
    const monitor = makeMonitor({ interval_seconds: 60 })
    expect(isMonitorDue(monitor, null, NOW)).toBe(true)
    expect(isMonitorDue(monitor, NOW - 30_000, NOW)).toBe(false)
    expect(isMonitorDue(monitor, NOW - 61_000, NOW)).toBe(true)
    expect(isMonitorDue(makeMonitor({ active: false }), null, NOW)).toBe(false)
  })
})
