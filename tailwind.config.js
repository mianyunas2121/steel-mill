/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: 'var(--brand-50)',
          100: 'var(--brand-100)',
          200: 'var(--brand-200)',
          300: 'var(--brand-300)',
          400: 'var(--brand-400)',
          500: 'var(--brand-500)',
          600: 'var(--brand-600)',
          700: 'var(--brand-700)',
          800: 'var(--brand-800)',
          900: 'var(--brand-900)',
          DEFAULT: 'var(--brand-600)',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          raised: 'var(--surface-raised)',
          sunken: 'var(--surface-sunken)',
          overlay: 'var(--surface-overlay)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          muted: 'var(--ink-muted)',
          subtle: 'var(--ink-subtle)',
          inverse: 'var(--ink-inverse)',
        },
        line: {
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)',
        },
        steel: {
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
          950: '#020617',
        },
        status: {
          success: 'var(--status-success)',
          successBg: 'var(--status-success-bg)',
          warning: 'var(--status-warning)',
          warningBg: 'var(--status-warning-bg)',
          danger: 'var(--status-danger)',
          dangerBg: 'var(--status-danger-bg)',
          info: 'var(--status-info)',
          infoBg: 'var(--status-info-bg)',
        },
        // Keep accent alias for gradual migration
        accent: {
          DEFAULT: 'var(--brand-600)',
          light: 'var(--brand-400)',
          dark: 'var(--brand-700)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      spacing: {
        4.5: '1.125rem',
        13: '3.25rem',
        15: '3.75rem',
        18: '4.5rem',
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        panel: 'var(--shadow-panel)',
        header: 'var(--shadow-header)',
        focus: 'var(--shadow-focus)',
        dropdown: 'var(--shadow-dropdown)',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
      maxWidth: {
        content: '1400px',
      },
      zIndex: {
        sidebar: '40',
        header: '30',
        modal: '50',
        toast: '60',
      },
    },
  },
  plugins: [],
};
