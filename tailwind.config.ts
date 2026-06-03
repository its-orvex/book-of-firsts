import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: '#FAF8F5',
        ink: '#1A1A1A',
        dust: '#E8E4DE',
        muted: '#8C8680',
        blush: '#E8D5C4',
      },
    },
  },
  plugins: [],
}
export default config
