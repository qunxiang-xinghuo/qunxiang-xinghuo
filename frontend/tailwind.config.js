/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'xh-primary': '#1a1a2e',
        'xh-accent': '#e94560',
        'xh-gold': '#f9a825',
        'xh-dark': '#16213e',
        'xh-card': '#0f3460',
        'xh-light': '#e8e8e8',
      },
      fontFamily: {
        sans: ['Noto Sans SC', 'system-ui', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'sparkle-rise': 'sparkleRise 3s linear infinite',
        'ping-slow': 'pingSlow 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'slide-up': 'slideUp 0.3s ease',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(233, 69, 96, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(233, 69, 96, 0.6)' },
        },
        sparkleRise: {
          '0%': { transform: 'translateY(100vh) scale(0)', opacity: '0' },
          '20%': { opacity: '1' },
          '80%': { opacity: '1' },
          '100%': { transform: 'translateY(-10vh) scale(1)', opacity: '0' },
        },
        pingSlow: {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        slideUp: {
          'from': { transform: 'translateY(100%)' },
          'to': { transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
