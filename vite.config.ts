import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const proxyTarget = env.VITE_DEV_PROXY_TARGET

  if (command === 'serve' && !proxyTarget) {
    throw new Error(
      'VITE_DEV_PROXY_TARGET is not defined. Copy .env.example to .env before running `npm run dev`.',
    )
  }

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: proxyTarget
        ? {
            '/api': {
              target: proxyTarget,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api/, ''),
            },
          }
        : undefined,
    },
  }
})
