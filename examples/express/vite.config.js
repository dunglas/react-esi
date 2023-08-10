import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react-esi'],
  },
  build: {
    commonjsOptions: {
      include: [/react-esi/, /node_modules/],
    },
  },
  // define: {'process.env': process.env}
})
