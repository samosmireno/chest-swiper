import { useEffect, useState } from 'react'
import type { Identity } from '../types'
import { LOGIN_INFO_URL } from '../config'

export type LoginState =
  | { status: 'loading' }
  | { status: 'user'; identity: Identity }   // resolved from portal
  | { status: 'fallback' }                    // show team-name entry

// Adapter: map the portal's response to our Identity. Update field names when the
// portal team provides the real contract.
function adapt(raw: unknown): Identity | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const first = typeof r.firstName === 'string' ? r.firstName : ''
  const last = typeof r.lastName === 'string' ? r.lastName : ''
  const display = typeof r.displayName === 'string' ? r.displayName : `${first} ${last}`.trim()
  if (!display) return null
  return {
    name: display,
    email: typeof r.email === 'string' ? r.email : '',
    specialty: typeof r.specialty === 'string' ? r.specialty : '',
    type: 'user',
  }
}

export function useLoginInfo(): LoginState {
  const [state, setState] = useState<LoginState>(() =>
    LOGIN_INFO_URL ? { status: 'loading' } : { status: 'fallback' },
  )

  useEffect(() => {
    if (!LOGIN_INFO_URL) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(LOGIN_INFO_URL, { credentials: 'include' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const identity = adapt(await res.json())
        if (cancelled) return
        setState(identity ? { status: 'user', identity } : { status: 'fallback' })
      } catch (err) {
        console.warn('[detect] login info fetch failed; falling back to team entry', err)
        if (!cancelled) setState({ status: 'fallback' })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
