import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      colors: {
        // Brand palette — burgundy/wine primary with soft rose accents.
        // 600/700 = burgundy (#520E44) used for buttons, titles, identity.
        // 100/200 = soft rose used for backgrounds, cards, decorative blocks.
        primary: {
          50:  '#fdf4f8',   // lightest wash for hover backgrounds
          100: '#FAD5E1',   // rosa empolvado / mauve — soft backgrounds
          200: '#F2C6D5',   // rosa muy claro — cards, banners, decorative
          300: '#e8a9c0',
          400: '#c77ba0',
          500: '#8E4585',   // mauve/magenta accent
          600: '#520E44',   // burgundy / vino — MAIN brand color (buttons, identity)
          700: '#450b3a',   // darker burgundy for hover states
          800: '#38092f',
          900: '#2b0724',
        },
        // Semantic aliases
        wine: '#520E44',
        rosaLight: '#F2C6D5',
        rosaPowder: '#FAD5E1',
        mauve: '#8E4585',
      },
    },
  },
  plugins: [],
};
export default config;
