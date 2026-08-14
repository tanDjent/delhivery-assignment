import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    // jsdom has no layout engine and does not resolve var(), so the CSS
    // contract is asserted against the stylesheet text instead of the DOM.
    css: false,
  },
})
