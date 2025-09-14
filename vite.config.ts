import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/ballercast-rx/',
  resolve: {
    alias: {
      'react-native': 'react-native-web'
    }
  }
})