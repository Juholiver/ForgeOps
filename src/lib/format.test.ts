import { describe, expect, it } from 'vitest'
import { formatInterval, formatLatency, formatRelative, getInitials, shortId } from './format'

describe('formatInterval', () => {
  it('keeps seconds below one minute', () => {
    expect(formatInterval(30)).toBe('30s')
    expect(formatInterval(59)).toBe('59s')
  })

  it('formats whole minutes', () => {
    expect(formatInterval(60)).toBe('1 min')
    expect(formatInterval(300)).toBe('5 min')
  })

  it('formats hours', () => {
    expect(formatInterval(3600)).toBe('1 h')
    expect(formatInterval(7200)).toBe('2 h')
  })
})

describe('formatLatency', () => {
  it('returns a dash for missing values', () => {
    expect(formatLatency(null)).toBe('—')
    expect(formatLatency(undefined)).toBe('—')
  })

  it('formats sub-second values in milliseconds', () => {
    expect(formatLatency(123.4)).toBe('123 ms')
    expect(formatLatency(0)).toBe('0 ms')
  })

  it('formats seconds with two decimals', () => {
    expect(formatLatency(1500)).toBe('1.50 s')
    expect(formatLatency(1000)).toBe('1.00 s')
  })
})

describe('shortId', () => {
  it('returns the first eight characters', () => {
    expect(shortId('e3917a37-fefa-48d7-b9f3-06ded8cdacdf')).toBe('e3917a37')
  })
})

describe('getInitials', () => {
  it('uses the first letters of up to two words', () => {
    expect(getInitials('Ada Lovelace')).toBe('AL')
    expect(getInitials('ada')).toBe('A')
    expect(getInitials('  mary   jane  ')).toBe('MJ')
  })

  it('ignores empty names', () => {
    expect(getInitials('')).toBe('')
  })
})

describe('formatRelative', () => {
  it('returns "agora" for the current instant', () => {
    expect(formatRelative(new Date().toISOString())).toBe('agora')
  })

  it('returns minutes for recent past', () => {
    const past = new Date(Date.now() - 5 * 60_000).toISOString()
    expect(formatRelative(past)).toBe('há 5 min')
  })

  it('returns hours for older events', () => {
    const past = new Date(Date.now() - 3 * 60 * 60_000).toISOString()
    expect(formatRelative(past)).toBe('há 3 h')
  })
})
