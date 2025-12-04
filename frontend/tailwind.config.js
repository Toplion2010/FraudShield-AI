/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#0a0e14',
          darker: '#050810',
          card: '#0f1419',
          green: '#00ff88',
          'green-dark': '#00cc6a',
          'green-light': '#00ffaa',
          'green-glow': 'rgba(0, 255, 136, 0.2)',
          red: '#ff3366',
          orange: '#ff9933',
          blue: '#00d4ff',
        },
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(0, 255, 136, 0.3)',
        'glow-green-lg': '0 0 40px rgba(0, 255, 136, 0.4)',
        'glow-red': '0 0 20px rgba(255, 51, 102, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 255, 136, 0.2), 0 0 10px rgba(0, 255, 136, 0.2)' },
          '100%': { boxShadow: '0 0 10px rgba(0, 255, 136, 0.4), 0 0 20px rgba(0, 255, 136, 0.3)' },
        },
      },
    },
  },
  plugins: [],
}
