import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import { AppShell } from '@/components/AppShell'
import { AvoidanceInventory } from '@/screens/AvoidanceInventory'
import { FearLadder } from '@/screens/FearLadder'
import { Home } from '@/screens/Home'
import { Onboarding } from '@/screens/Onboarding'
import { More, Progress } from '@/screens/Placeholder'
import { Screener } from '@/screens/Screener'
import { getLocalUserId, hasOnboardedLocally } from '@/lib/session'
import { useAuth } from '@/lib/useAuth'
import { useSync } from '@/lib/useSync'

export default function App() {
  const auth = useAuth()
  const syncState = useSync(auth.signedIn)

  return (
    <OnboardingGate>
      <Routes>
        {/* Top-level destinations carry the nav shell. */}
        <Route element={<AppShell />}>
          <Route path="/" element={<Home syncState={syncState} />} />
          <Route path="/ladder" element={<FearLadder />} />
          <Route path="/avoidance" element={<AvoidanceInventory />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/more" element={<More />} />
        </Route>

        {/*
          Focused flows render outside the shell. Navigation chrome during an
          exercise — and above all during a live exposure — is an invitation to
          escape, which is the behaviour the method exists to interrupt.
        */}
        <Route path="/welcome" element={<Onboarding />} />
        <Route path="/screener" element={<Screener />} />
      </Routes>
    </OnboardingGate>
  )
}

/**
 * The screener used to be the front door: a wall of checkboxes about intrusive
 * thoughts, with no framing and no explanation of why we were asking. That is
 * an interrogation, not an introduction. Nobody reaches it now without first
 * being told what this is and what they are agreeing to.
 */
function OnboardingGate({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  // Wrapped in an object on purpose. Dexie's `get` resolves to `undefined` when
  // no row exists, which is indistinguishable from useLiveQuery's own
  // still-loading `undefined` — and on a fresh install that means the gate
  // renders nothing, forever. The wrapper makes "loaded, but absent" a
  // distinct, representable state.
  const result = useLiveQuery(
    async () => ({ profile: (await db.profile.get(getLocalUserId())) ?? null }),
    [],
    undefined,
  )

  if (result === undefined) return null

  // The localStorage mirror closes the render-vs-live-query race when someone
  // finishes onboarding and we navigate away in the same tick.
  const onboarded = hasOnboardedLocally() || Boolean(result.profile?.onboardedAt)
  if (!onboarded && location.pathname !== '/welcome') {
    return <Navigate to="/welcome" replace />
  }

  return <>{children}</>
}
