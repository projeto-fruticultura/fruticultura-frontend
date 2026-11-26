import { mergeConfig } from 'vite'
import { config as loadEnv } from 'dotenv'
import base from './vite.config'

loadEnv({
  path: '.env.cypress.local',
  quiet: true,
})

const api = new URL(
  process.env.E2E_API_URL ||
    'http://localhost:3000/api'
)

export default mergeConfig(base, {
  define: {
    'import.meta.env.VITE_API_URL':
      JSON.stringify('/api'),
  },

  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,

    proxy: {
      '/api': {
        target: api.origin,
        changeOrigin: true,

        rewrite: (url: string) =>
          api.pathname.replace(/\/$/, '') +
          url.slice(4),
      },
    },
  },
})