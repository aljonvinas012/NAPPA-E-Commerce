/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Cream beige — soft warm surfaces / section backgrounds
        cream: '#E8DBC3',
        // Muted beige-tan — borders & dividers
        tan: '#CBB694',
        // Mocha — mid accent tone (badges, soft fills)
        olive: '#A9805F',
        // Mocha (deep) — primary buttons, links, active states
        oliveDark: '#6F4A32',
        // Deep mocha-brown — headings & dark surfaces
        bark: '#4A3324',
        // Rich ink-brown — body text
        ink: '#3A2A1D',
        // Vanilla cream — page background
        paper: '#FFF8EA',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Manrope"', 'sans-serif'],
      },
      borderRadius: {
        soft: '10px',
        card: '18px',
      },
      boxShadow: {
        soft: '0 6px 24px rgba(74, 51, 36, 0.10)',
        card: '0 10px 34px rgba(74, 51, 36, 0.14)',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(28px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        weave: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-18px) rotate(4deg)' },
        },
        checkPop: {
          '0%': { transform: 'scale(0) rotate(-20deg)', opacity: '0' },
          '60%': { transform: 'scale(1.15) rotate(4deg)' },
          '100%': { transform: 'scale(1) rotate(0)', opacity: '1' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.7s cubic-bezier(.22,.61,.36,1) both',
        'fade-in-left': 'fadeInLeft 0.7s cubic-bezier(.22,.61,.36,1) both',
        'fade-in-right': 'fadeInRight 0.7s cubic-bezier(.22,.61,.36,1) both',
        'fade-in': 'fadeIn 0.5s ease both',
        'pop-in': 'popIn 0.25s cubic-bezier(.22,.61,.36,1) both',
        'slide-down': 'slideDown 0.2s ease both',
        weave: 'weave 4s ease-in-out infinite',
        float: 'float 7s ease-in-out infinite',
        'float-slow': 'floatSlow 10s ease-in-out infinite',
        'check-pop': 'checkPop 0.45s cubic-bezier(.22,.61,.36,1) both',
      },
    },
  },
  plugins: [],
}
