import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import ViteYaml from '@modyfi/vite-plugin-yaml';
import dsv from '@rollup/plugin-dsv'


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    define: {
      'process.env.BSKY_APP_PASSWORD': JSON.stringify(env.BSKY_APP_PASSWORD),
      'process.env.BSKY_IDENTIFIER': JSON.stringify(env.BSKY_IDENTIFIER)
    },
    plugins: [react(), ViteYaml(), dsv()],
  }
})
