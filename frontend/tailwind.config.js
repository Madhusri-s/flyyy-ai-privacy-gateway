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
        nx: {
          bg:        "#050810",
          bgDeep:    "#030508",
          surface:   "#0a0f1a",
          glass:     "rgba(10,15,26,0.7)",
          border:    "rgba(99,102,241,0.15)",
          borderHi:  "rgba(99,102,241,0.4)",
          text:      "#e2e8f0",
          muted:     "#94a3b8",
          dim:       "#475569",
          violet:    "#7c3aed",
          violetLt:  "#a78bfa",
          cyan:      "#06b6d4",
          cyanLt:    "#67e8f9",
          emerald:   "#10b981",
          amber:     "#f59e0b",
          rose:      "#f43f5e",
          indigo:    "#6366f1",
        }
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        mono:    ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'nx':        '0 8px 32px -4px rgba(0,0,0,0.6)',
        'nx-sm':     '0 2px 12px -2px rgba(0,0,0,0.5)',
        'violet':    '0 0 20px -4px rgba(124,58,237,0.5)',
        'violet-lg': '0 0 40px -8px rgba(124,58,237,0.4)',
        'cyan':      '0 0 20px -4px rgba(6,182,212,0.5)',
        'cyan-sm':   '0 0 10px -2px rgba(6,182,212,0.3)',
        'emerald':   '0 0 20px -4px rgba(16,185,129,0.5)',
        'rose':      '0 0 20px -4px rgba(244,63,94,0.5)',
        'glass':     'inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.4)',
      },
      animation: {
        'pulse-slow':    'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow':     'spin 8s linear infinite',
        'spin-reverse':  'spin-reverse 12s linear infinite',
        'float':         'float 6s ease-in-out infinite',
        'scan-line':     'scan-line 3s linear infinite',
        'glow-pulse':    'glow-pulse 2s ease-in-out infinite',
        'slide-in':      'slide-in 0.4s cubic-bezier(0.16,1,0.3,1)',
        'fade-up':       'fade-up 0.5s cubic-bezier(0.16,1,0.3,1)',
        'counter':       'counter 0.8s ease-out forwards',
        'data-flow':     'data-flow 2s linear infinite',
        'shimmer':       'shimmer 2s linear infinite',
        'border-flow':   'border-flow 4s linear infinite',
      },
      keyframes: {
        'spin-reverse': { to: { transform: 'rotate(-360deg)' } },
        'float': {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-8px)' },
        },
        'scan-line': {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(400%)' },
        },
        'glow-pulse': {
          '0%,100%': { opacity: '0.6', filter: 'blur(0px)' },
          '50%':     { opacity: '1',   filter: 'blur(1px)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(-16px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'data-flow': {
          '0%':   { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
        'shimmer': {
          from: { backgroundPosition: '200% center' },
          to:   { backgroundPosition: '-200% center' },
        },
        'border-flow': {
          '0%,100%': { borderColor: 'rgba(99,102,241,0.2)' },
          '50%':     { borderColor: 'rgba(6,182,212,0.4)' },
        },
      },
      backgroundImage: {
        'nx-grid':     "linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)",
        'hero-radial': "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 70%)",
        'shimmer-gradient': "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
        'vi-gradient':  "linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)",
        'vi-gradient-r':"linear-gradient(135deg, #06b6d4 0%, #7c3aed 100%)",
      },
      backgroundSize: {
        'grid': '32px 32px',
      }
    },
  },
  plugins: [],
}
