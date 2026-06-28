import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  server: {
    port: 3000,       // Replace 3000 with your desired port
    strictPort: true, // Optional: if true, Vite will fail if the port is already in use
},
  plugins: [
    mkcert()
  ]
})