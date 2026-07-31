import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { getLocalUserId, setLocalUserId } from './session'
import { adoptLocalRecords } from './sync'

export interface AuthState {
  loading: boolean
  userId: string
  email: string | null
  signedIn: boolean
}

/**
 * Auth never gates use. Before sign-in, records are owned by a device-local
 * id; on first sign-in those records are adopted by the authenticated account
 * rather than orphaned.
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>(() => ({
    loading: Boolean(supabase),
    userId: getLocalUserId(),
    email: null,
    signedIn: false,
  }))

  useEffect(() => {
    if (!supabase) return

    let cancelled = false

    async function adopt(authUserId: string, email: string | null) {
      const previous = getLocalUserId()
      if (previous !== authUserId) {
        await adoptLocalRecords(previous, authUserId)
        setLocalUserId(authUserId)
      }
      if (!cancelled) {
        setState({ loading: false, userId: authUserId, email, signedIn: true })
      }
    }

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      if (session) void adopt(session.user.id, session.user.email ?? null)
      else setState((s) => ({ ...s, loading: false }))
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (cancelled) return
        if (session) void adopt(session.user.id, session.user.email ?? null)
        else
          setState({
            loading: false,
            userId: getLocalUserId(),
            email: null,
            signedIn: false,
          })
      },
    )

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [])

  return state
}
