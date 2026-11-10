/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#0B1120",
          sidebar: "#111827",
          card: "#151F32",
          cardHover: "#1A263E",
          cardActive: "#1F2D47",
          input: "#0E1726",
          border: "#263449",
          borderLight: "#334460",
          accent: "#3B82F6",
          cyan: "#06B6D4",
          spam: "#EF4444",
          spamBg: "rgba(239, 68, 68, 0.12)",
          spamBorder: "rgba(239, 68, 68, 0.35)",
          safe: "#22C55E",
          safeBg: "rgba(34, 197, 94, 0.12)",
          safeBorder: "rgba(34, 197, 94, 0.35)",
          warning: "#F59E0B",
          warningBg: "rgba(245, 158, 11, 0.12)",
          warningBorder: "rgba(245, 158, 11, 0.35)",
          text: "#F8FAFC",
          muted: "#94A3B8",
          dim: "#64748B",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-blue': '0 0 25px -5px rgba(59, 130, 246, 0.3)',
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.3)',
        'glow-spam': '0 0 25px -5px rgba(239, 68, 68, 0.35)',
        'glow-safe': '0 0 25px -5px rgba(34, 197, 94, 0.35)',
        'cyber-card': '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 0 1px #263449',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 2.5s ease-in-out infinite',
      },
      keyframes: {
        scan: {
          '0%, 100%': { transform: 'translateY(-100%)' },
          '50%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [],
}
