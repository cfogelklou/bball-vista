import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/ballercast-rx/',
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      '@common': resolve(__dirname, 'src/common'),
      '@abstractions': resolve(__dirname, 'src/web/abstractions')
    }
  }
})