import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as storage from './storage'
import type { CheckResult } from '../types'

function createMemoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (key: string) => (map.has(key) ? (map.get(key) as string) : null),
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => {
      map.delete(key)
    },
    setItem: (key: string, value: string) => {
      map.set(key, String(value))
    },
  }
}

function makeCheck(monitorId: string, overrides: Partial<CheckResult> = {}): CheckResult {
  return {
    id: crypto.randomUUID(),
    monitor_id: monitorId,
    status: 'up',
    http_status: 200,
    response_time_ms: 120,
    error_message: null,
    checked_at: new Date().toISOString(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', createMemoryStorage())
  storage.resetDatabase()
})

describe('seed', () => {
  it('cria monitores, checks e incidentes na primeira leitura', () => {
    const monitors = storage.listMonitors(1, 10)
    expect(monitors.total).toBe(3)

    const summary = storage.getDashboardSummary()
    expect(summary.total_monitors).toBe(3)
    expect(summary.active_monitors).toBe(3)
    expect(summary.total_checks).toBeGreaterThan(100)
    expect(summary.avg_uptime).toBeGreaterThan(0)

    const history = storage.getCheckHistory(monitors.items[0].id, 1, 50, 7)
    expect(history.checks.length).toBeGreaterThan(1)
    const times = history.checks.map((check) => check.checked_at)
    expect([...times].sort().reverse()).toEqual(times)
  })

  it('recria o seed quando os dados locais estão corrompidos', () => {
    localStorage.setItem('forgeops.db.v1', '{json inválido')
    expect(storage.listMonitors(1, 10).total).toBe(3)
  })

  it('marca monitores ativos como devidos após o intervalo', () => {
    expect(storage.getDueMonitors(Date.now() + 10 * 60_000)).toHaveLength(3)
    expect(storage.getDueMonitors(Date.now()).every((monitor) => monitor.active)).toBe(true)
  })
})

describe('CRUD de monitores', () => {
  it('cria, busca, alterna e apaga', () => {
    const created = storage.createMonitor({ name: 'Nova API', url: 'https://nova.example.com' })
    expect(created.active).toBe(true)
    expect(created.method).toBe('GET')
    expect(created.expected_status).toBe(200)
    expect(storage.getMonitor(created.id)?.name).toBe('Nova API')

    expect(storage.toggleMonitor(created.id).active).toBe(false)
    expect(storage.toggleMonitor(created.id).active).toBe(true)

    storage.deleteMonitor(created.id)
    expect(storage.getMonitor(created.id)).toBeUndefined()
    expect(storage.listMonitors(1, 10).total).toBe(3)
  })

  it('lança erro ao alternar monitor inexistente', () => {
    expect(() => storage.toggleMonitor('não-existe')).toThrow('Monitor não encontrado')
  })
})

describe('checks e incidentes', () => {
  it('abre incidente na falha e resolve quando volta ao ar', () => {
    const monitor = storage.listMonitors(1, 1).items[0]

    storage.recordCheck(
      makeCheck(monitor.id, {
        status: 'down',
        http_status: 503,
        error_message: 'HTTP 503 (esperado 200)',
      }),
    )
    const open = storage
      .listIncidents(1, 500)
      .items.filter((incident) => incident.monitor_id === monitor.id && incident.status !== 'resolved')
    expect(open.length).toBeGreaterThan(0)

    storage.recordCheck(makeCheck(monitor.id))
    const stillOpen = storage
      .listIncidents(1, 500)
      .items.filter((incident) => incident.monitor_id === monitor.id && incident.status !== 'resolved')
    expect(stillOpen).toHaveLength(0)
  })

  it('atualiza o status de um incidente', () => {
    const monitor = storage.listMonitors(1, 1).items[0]
    storage.recordCheck(
      makeCheck(monitor.id, { status: 'timeout', error_message: 'Tempo esgotado (30s)' }),
    )

    const incident = storage.listIncidents(1, 500, 'open').items[0]
    expect(incident).toBeDefined()

    const investigating = storage.updateIncidentStatus(incident.id, 'investigating')
    expect(investigating.status).toBe('investigating')
    expect(investigating.resolved_at).toBeNull()

    const resolved = storage.updateIncidentStatus(incident.id, 'resolved')
    expect(resolved.status).toBe('resolved')
    expect(resolved.resolved_at).not.toBeNull()
  })

  it('filtra incidentes por status', () => {
    const all = storage.listIncidents(1, 500)
    const resolved = storage.listIncidents(1, 500, 'resolved')
    expect(resolved.total).toBeLessThanOrEqual(all.total)
    expect(resolved.items.every((incident) => incident.status === 'resolved')).toBe(true)
  })

  it('remove checks e incidentes junto com o monitor', () => {
    const monitor = storage.listMonitors(1, 1).items[0]
    storage.recordCheck(
      makeCheck(monitor.id, { status: 'down', error_message: 'HTTP 500 (esperado 200)' }),
    )
    storage.deleteMonitor(monitor.id)

    const history = storage.getCheckHistory(monitor.id, 1, 50, 7)
    expect(history.total).toBe(0)
    expect(
      storage.listIncidents(1, 500).items.some((incident) => incident.monitor_id === monitor.id),
    ).toBe(false)
  })
})
