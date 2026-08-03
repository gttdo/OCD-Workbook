import { Link } from 'react-router-dom'
import { SignInForm } from '@/components/SignInForm'
import type { AuthState } from '@/lib/useAuth'

/**
 * Sign in and create account share a screen, differing only in which mode the
 * form opens in and what the page says around it. Redirecting away once a
 * session exists is handled by the route, not here.
 */
export function SignIn({
  mode,
}: {
  auth: AuthState
  mode: 'signin' | 'signup'
}) {
  const signingUp = mode === 'signup'

  return (
    <div className="mx-auto w-full max-w-md px-5 pb-16 pt-14 sm:px-6 sm:pt-20">
      <h1 className="text-2xl font-semibold text-ink-900">
        {signingUp ? 'Create your account' : 'Welcome back'}
      </h1>

      <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
        {signingUp
          ? 'Your ladder and everything you write stays attached to this account, so it follows you between devices and survives a cleared browser.'
          : 'Your ladder, your exposures and everything you have written will come back to this device.'}
      </p>

      <div className="mt-6">
        <SignInForm initialMode={mode} />
      </div>

      <div className="mt-6 space-y-2 text-center">
        <Link
          to={signingUp ? '/signin' : '/signup'}
          className="tap block text-sm text-ink-500 underline decoration-ink-300
                     underline-offset-4 active:text-ink-800"
        >
          {signingUp
            ? 'I already have an account'
            : 'I have not used this before'}
        </Link>
        <Link
          to="/"
          className="tap block text-sm text-ink-400 underline decoration-ink-300
                     underline-offset-4 active:text-ink-700"
        >
          What is this?
        </Link>
      </div>
    </div>
  )
}
