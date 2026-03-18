/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      /** min-width: auto — not in default Tailwind; use with xs: below 480px */
      minWidth: {
        auto: 'auto',
      },
      colors: {
        brand: {
          primary: 'var(--brand-primary)',
          'primary-hover': 'var(--brand-primary-hover)',
          dark: 'var(--brand-dark)',
          text: 'var(--brand-text)',
          'text-muted': 'var(--brand-text-muted)',
          border: 'var(--brand-border)',
          bg: 'var(--brand-bg)',
          'bg-soft': 'var(--brand-bg-soft)',
          'code-bg': 'var(--brand-code-bg)',
          accent: 'var(--brand-accent)',
          placeholder: 'var(--brand-placeholder)',
        },
      },
    },
  },
  plugins: [
    /** xs: applies when viewport width is below 480px */
    function xsMaxWidthPlugin({ addVariant }) {
      addVariant('xs', '@media (max-width: 480px) { & }')
    },
  ],
}

