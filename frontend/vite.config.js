import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/auth': 'http://localhost:8000',
      '/applications': 'http://localhost:8000',
      '/health': 'http://localhost:8000'
    }
  }
})