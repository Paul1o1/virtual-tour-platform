import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#0E3B34',
          light: '#16534A',
          dark: '#082520',
        },
        teal: {
          DEFAULT: '#2F7F79',
          light: '#3C9C95',
          dark: '#215A56',
        },
        saffron: {
          DEFAULT: '#F0B429',
          hover: '#D99F1C',
          light: '#F7CB65',
          dark: '#B8820B',
        },
        mist: '#EAF1ED',
        paper: '#FBFCFA',
        ink: {
          DEFAULT: '#14201D',
          light: '#1E2E2A',
          dark: '#0B1311',
        },
        muted: '#4F615C',
        line: '#D5E0DA',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', '"Trebuchet MS"', 'system-ui', 'sans-serif'],
        body: ['Figtree', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
