import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import ImageKit from '@imagekit/nodejs'

function imageKitDevPlugin() {
  return {
    name: 'imagekit-dev-auth',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || ''
        if (url === '/api/imagekit-auth' || url.startsWith('/api/imagekit-auth?')) {
          if (req.method !== 'GET') {
            return next()
          }

          try {
            const env = loadEnv('development', process.cwd(), '')
            const privateKey = env.IMAGEKIT_PRIVATE_KEY || process.env.IMAGEKIT_PRIVATE_KEY
            const publicKey = env.IMAGEKIT_PUBLIC_KEY || env.VITE_IMAGEKIT_PUBLIC_KEY || process.env.IMAGEKIT_PUBLIC_KEY || ''

            if (!privateKey) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              return res.end(
                JSON.stringify({
                  error: 'IMAGEKIT_PRIVATE_KEY is not configured in .env. Please add it to your .env file.'
                })
              )
            }

            const imagekit = new ImageKit({ privateKey })
            const authParams = imagekit.helper.getAuthenticationParameters()

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            return res.end(
              JSON.stringify({
                ...authParams,
                publicKey
              })
            )
          } catch (err) {
            console.error('ImageKit dev auth error:', err)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            return res.end(
              JSON.stringify({
                error: err.message || 'Failed to generate ImageKit authentication parameters'
              })
            )
          }
        }
        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), imageKitDevPlugin()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
