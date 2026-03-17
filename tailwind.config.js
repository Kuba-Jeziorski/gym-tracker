/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
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
  plugins: [],
}

