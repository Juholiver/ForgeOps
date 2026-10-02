import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { runHealthCheck } from '../lib/healthCheck'
import { getDueMonitors, recordCheck } from '../services/storage'

const TICK_MS = 30_000
const MAX_PER_TICK = 5

export function useAutoChecks() {
  const queryClient = useQueryClient()

  useEffect(() => {
    let running = false
    let cancelled = false

    const runDueChecks = async () => {
      if (running || cancelled) return
      running = true
      try {
        const due = getDueMonitors(Date.now())
        if (due.length === 0) return
        for (const monitor of due.slice(0, MAX_PER_TICK)) {
          if (cancelled) return
          const check = await runHealthCheck(monitor)
          recordCheck(check)
        }
        await queryClient.invalidateQueries()
      } catch {
        // falhas de rede/storage não devem derrubar o loop
      } finally {
        running = false
      }
    }

    const timer = setInterval(() => {
      void runDueChecks()
    }, TICK_MS)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [queryClient])
}
