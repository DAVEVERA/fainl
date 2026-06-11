import path from 'path';
import fs from 'fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Copies dist/index.html → dist/404.html after every build.
// GitHub Pages serves 404.html at the *original URL* (no HTTP redirect),
// so React Router picks up window.location.pathname directly and there are
// no redirect hops for Googlebot to report in Search Console.
const copyIndexTo404: Plugin = {
  name: 'copy-index-to-404',
  apply: 'build',
  closeBundle() {
    const src  = path.resolve(__dirname, 'dist/index.html');
    const dest = path.resolve(__dirname, 'dist/404.html');
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log('✓ dist/index.html → dist/404.html (GitHub Pages SPA routing)');
    }
  },
};

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), copyIndexTo404],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
