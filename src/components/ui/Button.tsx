import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'quiet'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  full?: boolean
  children: ReactNode
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink-900 text-white shadow-card active:bg-ink-800',
  secondary: 'border border-ink-300 bg-white text-ink-800 active:bg-ink-50',
  quiet: 'text-ink-500 active:text-ink-800',
}

/**
 * Buttons are plain and calm. No gradients, no exclamation, no urgency —
 * an over-eager call to action reads as pressure to someone who is already
 * being pressured by their own head.
 */
export function Button({
  variant = 'primary',
  full,
  className = '',
  children,
  ...rest
}: Props) {
  return (
    <button
      className={[
        'tap rounded-xl px-4 py-3 font-medium',
        'transition-all duration-150 ease-out active:scale-[0.98]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-calm-600 focus-visible:ring-offset-2',
        'disabled:opacity-40',
        VARIANTS[variant],
        full ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}
