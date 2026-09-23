import colors from 'tailwindcss/colors';

const tremorColors = [
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
].join('|');

const brandColors = [
  'datadein-marine',
  'datadein-energi',
  'datadein-sten',
  'datadein-hav',
  'datadein-himmel',
].join('|');

const tremorShades = '50|100|200|300|400|500|600|700|800|900|950';

/** @type {import('tailwindcss').Config} */
export default {
  important: '.dd-root',
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    {
      pattern: new RegExp(
        `^(bg|text|border|ring|stroke|fill)-((?:${tremorColors})|(?:${brandColors}))(-(${tremorShades}))?$`,
      ),
      variants: ['hover', 'dark', 'dark:hover'],
    },
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        'datadein-marine': {
          DEFAULT: 'var(--dd-marine-500)',
          50: 'var(--dd-marine-50)',
          100: 'var(--dd-marine-100)',
          200: 'var(--dd-marine-200)',
          300: 'var(--dd-marine-300)',
          400: 'var(--dd-marine-400)',
          500: 'var(--dd-marine-500)',
          600: 'var(--dd-marine-600)',
          700: 'var(--dd-marine-700)',
          800: 'var(--dd-marine-800)',
          900: 'var(--dd-marine-900)',
        },
        'datadein-energi': {
          DEFAULT: 'var(--dd-energi-500)',
          50: 'var(--dd-energi-50)',
          100: 'var(--dd-energi-100)',
          200: 'var(--dd-energi-200)',
          300: 'var(--dd-energi-300)',
          400: 'var(--dd-energi-400)',
          500: 'var(--dd-energi-500)',
          600: 'var(--dd-energi-600)',
          700: 'var(--dd-energi-700)',
          800: 'var(--dd-energi-800)',
          900: 'var(--dd-energi-900)',
        },
        'datadein-sten': {
          DEFAULT: 'var(--dd-sten-500)',
          50: 'var(--dd-sten-50)',
          100: 'var(--dd-sten-100)',
          200: 'var(--dd-sten-200)',
          300: 'var(--dd-sten-300)',
          400: 'var(--dd-sten-400)',
          500: 'var(--dd-sten-500)',
          600: 'var(--dd-sten-600)',
          700: 'var(--dd-sten-700)',
          800: 'var(--dd-sten-800)',
          900: 'var(--dd-sten-900)',
        },
        'datadein-hav': {
          DEFAULT: 'var(--dd-hav-500)',
          50: 'var(--dd-hav-50)',
          100: 'var(--dd-hav-100)',
          200: 'var(--dd-hav-200)',
          300: 'var(--dd-hav-300)',
          400: 'var(--dd-hav-400)',
          500: 'var(--dd-hav-500)',
          600: 'var(--dd-hav-600)',
          700: 'var(--dd-hav-700)',
          800: 'var(--dd-hav-800)',
          900: 'var(--dd-hav-900)',
        },
        'datadein-himmel': {
          DEFAULT: 'var(--dd-himmel-500)',
          50: 'var(--dd-himmel-50)',
          100: 'var(--dd-himmel-100)',
          200: 'var(--dd-himmel-200)',
          300: 'var(--dd-himmel-300)',
          400: 'var(--dd-himmel-400)',
          500: 'var(--dd-himmel-500)',
          600: 'var(--dd-himmel-600)',
          700: 'var(--dd-himmel-700)',
          800: 'var(--dd-himmel-800)',
          900: 'var(--dd-himmel-900)',
        },
        tremor: {
          brand: {
            faint: 'var(--tremor-brand-faint)',
            muted: 'var(--tremor-brand-muted)',
            subtle: 'var(--tremor-brand-subtle)',
            DEFAULT: 'var(--tremor-brand)',
            emphasis: 'var(--tremor-brand-emphasis)',
            inverted: colors.white,
          },
          background: {
            muted: 'var(--tremor-background-muted)',
            subtle: 'var(--tremor-background-subtle)',
            DEFAULT: 'var(--tremor-background)',
            emphasis: 'var(--tremor-background-emphasis)',
          },
          border: {
            DEFAULT: 'var(--tremor-border)',
          },
          ring: {
            DEFAULT: 'var(--tremor-ring)',
          },
          content: {
            subtle: 'var(--tremor-content-subtle)',
            DEFAULT: 'var(--tremor-content)',
            emphasis: 'var(--tremor-content-emphasis)',
            strong: 'var(--tremor-content-strong)',
            inverted: colors.white,
          },
        },
      },
      fontSize: {
        'dd-panel-title': [
          '1.5rem',
          { lineHeight: '1.2', letterSpacing: '-0.02em' },
        ],
        'dd-card-label': [
          '0.7rem',
          { lineHeight: '1.4', letterSpacing: '0.14em' },
        ],
        'dd-body': ['0.875rem', { lineHeight: '1.5' }],
      },
      fontFamily: {
        display: ['Kanit', 'ui-sans-serif', 'sans-serif'],
        body: ['Titillium Web', 'ui-sans-serif', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
