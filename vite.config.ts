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

  // Pre-bundle all CodeMirror language packages to prevent runtime dep discovery
  // (runtime discovery triggers a forced HMR full-reload which crashes webkit2gtk)
  optimizeDeps: {
    include: [
      '@altagen/velt-core',
      '@codemirror/language-data',
      '@codemirror/lang-angular',
      '@codemirror/lang-cpp',
      '@codemirror/lang-css',
      '@codemirror/lang-go',
      '@codemirror/lang-html',
      '@codemirror/lang-java',
      '@codemirror/lang-javascript',
      '@codemirror/lang-jinja',
      '@codemirror/lang-json',
      '@codemirror/lang-less',
      '@codemirror/lang-liquid',
      '@codemirror/lang-markdown',
      '@codemirror/lang-php',
      '@codemirror/lang-python',
      '@codemirror/lang-rust',
      '@codemirror/lang-sass',
      '@codemirror/lang-sql',
      '@codemirror/lang-vue',
      '@codemirror/lang-wast',
      '@codemirror/lang-xml',
      '@codemirror/lang-yaml',
    ],
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
