/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deliberately calm and low-arousal. No alarm reds in the UI chrome —
        // the anxiety scale is the only place colour carries intensity.
        ink: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        calm: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          300: '#5eead4',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
        },
        /*
         * The distress scale, and the only place colour encodes intensity.
         * Four bands matching the labels the scale already shows, validated as
         * an ordinal ramp: monotone lightness, visible gaps, single hue, light
         * end clearing the surface.
         *
         * Teal rather than red on purpose. A 9 should read as "more", not as a
         * fire alarm — the person rating it is already frightened.
         */
        level: {
          slight: '#14b8a6',
          moderate: '#0d9488',
          substantial: '#0f766e',
          extreme: '#115e59',
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        lift: '0 2px 4px -1px rgb(15 23 42 / 0.06), 0 6px 16px -4px rgb(15 23 42 / 0.10)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'draw': {
          from: { strokeDashoffset: 'var(--dash)' },
          to: { strokeDashoffset: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 260ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 200ms ease-out both',
        draw: 'draw 900ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
