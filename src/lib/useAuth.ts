import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { setCurrentUserId } from './session'

export interface AuthState {
  loading: boolean
  userId: string | null
  email: string | null
  signedIn: boolean
}

/**
 * Auth is required. Every screen that writes data renders behind the gate in
 * App.tsx, so `currentUserId()` is safe to call from any of them.
 *
 * There is deliberately no device-local identity any more. Records are owned
 * by the authenticated user from the moment they are created.
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    loading: Boolean(supabase),
    userId: null,
    email: null,
    signedIn: false,
  })

  useEffect(() => {
    if (!supabase) {
      setState({ loading: false, userId: null, email: null, signedIn: false })
      return
    }

    let cancelled = false

    function apply(session: { user: { id: string; email?: string } } | null) {
      if (cancelled) return
      setCurrentUserId(session?.user.id ?? null)
      setState({
        loading: false,
        userId: session?.user.id ?? null,
        email: session?.user.email ?? null,
        signedIn: Boolean(session),
      })
    }

    void supabase.auth.getSession().then(({ data: { session } }) => apply(session))

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) =>
      apply(session),
    )

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [])

  return state
}
