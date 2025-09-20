/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      '@common': resolve(__dirname, 'src/common'),
      '@abstractions': resolve(__dirname, 'src/web/abstractions')
    }
  }
})