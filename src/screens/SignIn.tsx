import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Screen } from '@/components/AppShell'
import { SignInForm } from '@/components/SignInForm'
import type { AuthState } from '@/lib/useAuth'

/**
 * The way back to your own work.
 *
 * Lives outside the onboarding gate, because the person who needs it most is
 * someone who has already been through onboarding — on a phone that has never
 * seen this app. Without it, the only route back to your data was to sit
 * through onboarding again, complete the screener a second time, and then find
 * it buried in settings.
 */
export function SignIn({ auth }: { auth: AuthState }) {
  const navigate = useNavigate()

  // The magic link lands here or on "/" with a token; once the session is
  // established there is nothing left to do on this screen.
  useEffect(() => {
    if (auth.signedIn) navigate('/', { replace: true })
  }, [auth.signedIn, navigate])

  return (
    <Screen title="Welcome back">
      <div className="space-y-6">
        <SignInForm
          intro={
            <p className="text-sm leading-relaxed text-ink-600">
              Enter the email you used before and we will send you a link. Your
              ladder, your exposures and everything you have written will come
              back to this device.
            </p>
          }
        />

        <Link
          to="/welcome"
          className="tap block text-center text-sm text-ink-500 underline
                     decoration-ink-300 underline-offset-4 active:text-ink-800"
        >
          I have not used this before
        </Link>
      </div>
    </Screen>
  )
}
