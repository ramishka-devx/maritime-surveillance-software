/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-blue': '#243b78',
        'accent-orange': '#f28c1b',
        'nav-bg': '#0b1220',
        'nav-bg-soft': '#111b2e',
        'dark-text': '#0f172a',
        'gray-text': '#64748b',
        'text-muted': '#94a3b8',
        'text-placeholder': '#cbd5e1',
      },
      backgroundColor: {
        'input-bg': '#f1f5f9',
        'error-bg': '#fee2e2',
        'success-bg': '#dcfce7',
        'warning-bg': '#fef3c7',
      },
      borderColor: {
        'input-border': '#e2e8f0',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'card-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}
