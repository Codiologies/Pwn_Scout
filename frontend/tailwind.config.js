/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      screens: {
        xs: '400px'
      },
      colors: {
        void: '#03060B',
        deck: '#070C14',
        deck2: '#0A121C',
        line: '#14243A',
        edge: '#1E3A5C',
        cyan: { DEFAULT: '#00E5FF', dim: '#0B96AD' },
        amber: { DEFAULT: '#FFA31A', dim: '#C97C10' },
        lime: { DEFAULT: '#00E08A', dim: '#00A866' },
        red: { DEFAULT: '#FF3355', dim: '#C2223C' },
        orange: { DEFAULT: '#FF6B2C', dim: '#C24E1F' },
        blue: { DEFAULT: '#4D9FFF', dim: '#3A7ACC' },
        text: { primary: '#DCE9F5', muted: '#6B8199', faint: '#3E5266' },

        // Aliases so any stray legacy utility classes still resolve.
        bg: '#03060B',
        surface: '#070C14',
        border: '#14243A',
        green: { DEFAULT: '#00E08A', dim: '#00A866' }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        display: ['"Chakra Petch"', '"Syne"', 'sans-serif']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar': 'radarSweep 3.2s linear infinite',
        'blink': 'blink 1s step-end infinite',
        'drift': 'drift 24s linear infinite',
        'ping-slow': 'blipPing 2.4s ease-out infinite'
      },
      keyframes: {
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' }
        },
        drift: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '64px 64px' }
        },
        blipPing: {
          '0%': { transform: 'scale(1)', opacity: '0.7' },
          '100%': { transform: 'scale(3.2)', opacity: '0' }
        }
      }
    }
  },
  plugins: []
};
