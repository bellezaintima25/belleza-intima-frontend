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
        // Secondary / body font: Corbel (system font on Windows/Office).
        sans: ['Corbel', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        // Primary / display font: Atlane (loaded via @font-face in globals.css).
        serif: ['Atlane', 'var(--font-playfair)', 'Georgia', 'serif'],
      },
      colors: {
        // Brand palette — updated tones.
        // 600/700 = brand wine (#8B1A3A, matches the logo) — buttons, titles, identity.
        // 100/200 = soft rose used for backgrounds, cards, decorative blocks.
        primary: {
          50:  '#fdf4f8',   // lightest wash for hover backgrounds
          100: '#F4DCDC',   // rosa muy claro — soft backgrounds
          200: '#D299A0',   // rosa — cards, banners, decorative
          300: '#e8a9c0',
          400: '#c77ba0',
          500: '#FFF0F0',   // near-white blush accent
          600: '#8B1A3A',   // brand wine — matches the logo (buttons, identity)
          700: '#450b3a',   // darker for hover states
          800: '#38092f',
          900: '#2b0724',
        },
        // Semantic aliases
        wine: '#8B1A3A',
        rosaLight: '#D299A0',
        rosaPowder: '#F4DCDC',
        mauve: '#FFF0F0',
      },
    },
  },
  plugins: [],
};
export default config;
