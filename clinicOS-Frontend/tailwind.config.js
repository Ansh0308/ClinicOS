/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ─── COLORS from ClinicOS Design System ───────────────────────
      colors: {
        crimson: {
          100: '#FBEAF0',
          200: '#F2C5D4',
          300: '#E89098',
          400: '#D95570',
          500: '#C43055',  // ← primary brand color
          600: '#A02040',
          700: '#7A1530',
          800: '#4E0E20',  // ← dark CTA buttons
          900: '#1C0910',  // ← headlines
        },
        cream: {
          50:  '#FDFAF4',  // ← page background
          100: '#F5EDD8',  // ← section backgrounds
          200: '#EDE3C8',
          300: '#E0D4B5',  // ← card borders
          400: '#C8BB9A',
        },
        text: {
          primary:   '#1C0910',
          secondary: '#3C1C28',
          body:      '#5C3040',
          muted:     '#8A6070',
        },
        accent: {
          yellow:  '#F0C030',  // ← CTA yellow button
          peach:   '#F0A078',
          teal:    '#5AB09A',
          lavender:'#9080C0',
          sky:     '#70B8D8',
          coral:   '#E85060',
        },
      },

      // ─── FONTS from Design System ─────────────────────────────────
      fontFamily: {
        display: ['Fredoka', 'cursive'],       // headings, logo
        body:    ['DM Sans', 'sans-serif'],    // all body text
      },

      // ─── BORDER RADIUS (heavily rounded design) ───────────────────
      borderRadius: {
        'xl':   '16px',
        '2xl':  '24px',
        '3xl':  '32px',
        'pill': '100px',  // ← buttons, nav pill
      },

      // ─── SHADOWS ──────────────────────────────────────────────────
      boxShadow: {
        'card':  '0 4px 20px rgba(30,9,16,0.10)',
        'nav':   '0 8px 32px rgba(30,9,16,0.20)',
        'btn':   '0 4px 16px rgba(78,14,32,0.30)',
        'hero':  '0 20px 60px rgba(30,9,16,0.15)',
      },
    },
  },
  plugins: [],
}