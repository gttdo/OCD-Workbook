import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import { AppShell } from '@/components/AppShell'
import { AvoidanceInventory } from '@/screens/AvoidanceInventory'
import { ErpSession } from '@/screens/ErpSession'
import { FearLadder } from '@/screens/FearLadder'
import { Home } from '@/screens/Home'
import { Landing } from '@/screens/Landing'
import { Onboarding } from '@/screens/Onboarding'
import { More } from '@/screens/More'
import { Progress } from '@/screens/Progress'
import { ResetPassword } from '@/screens/ResetPassword'
import { Screener } from '@/screens/Screener'
import { SignIn } from '@/screens/SignIn'
import { StarterExposures } from '@/screens/StarterExposures'
import { UrgeTimer } from '@/screens/UrgeTimer'
import { Values } from '@/screens/Values'
import { hasOnboardedLocally } from '@/lib/session'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
import { useSync } from '@/lib/useSync'

/** Reachable without a session. Everything else requires one. */
const PUBLIC = new Set(['/', '/signin', '/signup', '/reset'])

export default function App() {
  const auth = useAuth()
  const syncState = useSync(auth.signedIn)

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Entry auth={auth} />} />
      <Route path="/signin" element={<Guest auth={auth}><SignIn auth={auth} mode="signin" /></Guest>} />
      <Route path="/signup" element={<Guest auth={auth}><SignIn auth={auth} mode="signup" /></Guest>} />
      <Route path="/reset" element={<ResetPassword auth={auth} />} />

      {/* Signed in, but onboarding comes first */}
      <Route path="/welcome" element={<Protected auth={auth}><Onboarding /></Protected>} />

      {/* The app */}
      <Route
        element={
          <Protected auth={auth} requireOnboarded>
            <AppShell />
          </Protected>
        }
      >
        <Route path="/home" element={<Home syncState={syncState} />} />
        <Route path="/ladder" element={<FearLadder />} />
        <Route path="/avoidance" element={<AvoidanceInventory />} />
        <Route path="/practice" element={<StarterExposures />} />
        <Route path="/urge" element={<UrgeTimer />} />
        <Route path="/values" element={<Values />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/more" element={<More auth={auth} syncState={syncState} />} />
      </Route>

      {/*
        Focused flows render outside the shell. Navigation chrome during an
        exercise — and above all during a live exposure — is an invitation to
        escape, which is the behaviour the method exists to interrupt.
      */}
      <Route path="/screener" element={<Protected auth={auth} requireOnboarded><Screener /></Protected>} />
      <Route
        path="/exposure/:triggerId"
        element={<Protected auth={auth} requireOnboarded><ErpSession /></Protected>}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

/** `/` is the landing page for a visitor and a redirect for a member. */
function Entry({ auth }: { auth: AuthLike }) {
  if (auth.loading) return null
  if (auth.signedIn) return <Navigate to="/home" replace />
  return <Landing />
}

/** Auth screens push a signed-in person onwards rather than showing a form. */
function Guest({ auth, children }: { auth: AuthLike; children: React.ReactNode }) {
  if (auth.loading) return null
  if (auth.signedIn) return <Navigate to="/home" replace />
  return <>{children}</>
}

type AuthLike = ReturnType<typeof useAuth>

/**
 * The gate. No session means the landing page; a session without onboarding
 * means onboarding.
 *
 * Auth being required does NOT mean a connection is required. Supabase keeps
 * the session locally and the data lives in IndexedDB, so after the first
 * sign-in this all works with no signal — which is the point, because
 * exposures happen in basements and car parks.
 */
function Protected({
  auth,
  children,
  requireOnboarded,
}: {
  auth: AuthLike
  children: React.ReactNode
  requireOnboarded?: boolean
}) {
  const location = useLocation()

  // Wrapped in an object on purpose. Dexie's `get` resolves to `undefined` when
  // no row exists, which is indistinguishable from useLiveQuery's own
  // still-loading `undefined` — and that means rendering nothing, forever.
  const result = useLiveQuery(
    async () =>
      auth.userId
        ? { profile: (await db.profile.get(auth.userId)) ?? null }
        : { profile: null },
    [auth.userId],
    undefined,
  )

  if (auth.loading) return null

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-xl items-center justify-center px-6">
        <p className="text-center text-[15px] leading-relaxed text-ink-500">
          This build has no account service configured, so there is nothing to
          sign in to.
        </p>
      </div>
    )
  }

  if (!auth.signedIn) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }

  if (!requireOnboarded) return <>{children}</>
  if (result === undefined) return null

  // The localStorage mirror closes the render-vs-live-query race when someone
  // finishes onboarding and we navigate away in the same tick.
  const onboarded =
    hasOnboardedLocally(auth.userId!) || Boolean(result.profile?.onboardedAt)

  if (!onboarded) return <Navigate to="/welcome" replace />

  return <>{children}</>
}

export { PUBLIC }
