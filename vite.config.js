import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  build: {
    outDir:   'dist',
    assetsDir: 'assets',
    minify:   'oxc',
    rollupOptions: {
      input: {
        main:        'index.html',
        collections: 'collections.html',
        news:        'news.html',
        gallery:     'gallery.html',
        contact:     'contact.html',
        '404':       '404.html',
      },
      output: {
        manualChunks: function (id) {
          if (id.includes('node_modules/three')) return 'three';
        },
      },
    },
  },
  server: {
    port: 8080,
    open: true,
  },
})
