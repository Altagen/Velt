import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],

  // Prevent vite from obscuring rust errors
  clearScreen: false,

  // Tauri expects a fixed port, fail if that port is not available
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      // Tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['@altagen/velt-core'],
  },

  // Better handling of local packages
  resolve: {
    dedupe: ['svelte'],
  },

  // Preserve method names for Svelte 5 reactive proxy while keeping minification
  esbuild: {
    keepNames: true,
  },

  build: {
    minify: 'esbuild',
    target: 'esnext',
    rollupOptions: {
      output: {
        // Force new file names to bust WebView cache - v13 (Encoding Conversion)
        entryFileNames: `assets/[name]-[hash]-v${Date.now()}.js`,
        chunkFileNames: `assets/[name]-[hash]-v${Date.now()}.js`,
        assetFileNames: `assets/[name]-[hash]-v${Date.now()}[extname]`
      }
    }
  },
})
