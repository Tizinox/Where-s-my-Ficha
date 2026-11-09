import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

function steamProxyPlugin() {
  return {
    name: 'steam-proxy-server',
    configureServer(server) {
      server.middlewares.use('/api/steam-proxy', async (req, res) => {
        try {
          const u = new URL(req.url, 'http://localhost');
          const cursor = u.searchParams.get('cursor') || '';
          const count = u.searchParams.get('count') || '1000';
          let targetUrl = `https://api.steampowered.com/ILoyaltyRewardsService/QueryRewardItems/v1/?count=${count}&community_item_classes[0]=14`;
          if (cursor) {
            targetUrl += `&cursor=${encodeURIComponent(cursor)}`;
          }

          const steamRes = await fetch(targetUrl);
          const data = await steamRes.json();
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify(data));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    }
  };
}

function htmlPartialsPlugin() {
  const includeRegex = /<include\s+src=["']([^"']+)["']\s*(?:\/>|><\/include>)/gi;

  function expandIncludes(html, rootDir, depth = 0) {
    if (depth > 10) return html;
    return html.replace(includeRegex, (match, srcPath) => {
      const cleanPath = srcPath.startsWith('/') ? srcPath.slice(1) : srcPath;
      const fullPath = path.resolve(rootDir, cleanPath);
      if (!fs.existsSync(fullPath)) {
        console.error(`[html-partials] Include not found: ${fullPath}`);
        return `<!-- ERROR: Include not found: ${srcPath} -->`;
      }
      const partialContent = fs.readFileSync(fullPath, 'utf8');
      return expandIncludes(partialContent, rootDir, depth + 1);
    });
  }

  return {
    name: 'html-partials-plugin',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const rootDir = ctx.server ? ctx.server.config.root : process.cwd();
        return expandIncludes(html, rootDir);
      }
    },
    configureServer(server) {
      const partialsDir = path.resolve(__dirname, 'src/partials');
      if (fs.existsSync(partialsDir)) {
        server.watcher.add(partialsDir);
      }
      server.watcher.on('change', (file) => {
        if (file.includes('partials') && file.endsWith('.html')) {
          server.ws.send({ type: 'full-reload' });
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [steamProxyPlugin(), htmlPartialsPlugin()],
  optimizeDeps: {
    include: [
      'alpinejs',
      '@alpinejs/collapse',
      'cropperjs',
      'dexie',
      'downloadjs',
      'html2canvas',
      'lucide'
    ]
  },
  server: {
    open: true,
    host: true,
    port: 5173,
    strictPort: true,
    hmr: {
      host: 'localhost',
      port: 5173,
      clientPort: 5173
    },
    watch: {
      ignored: ['**/scratch/**', '**/.git/**', '**/.gemini/**']
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('steamAvatarsCatalog')) {
            return 'steam-avatars-catalog';
          }
          if (id.includes('steamFramesCatalog')) {
            return 'steam-frames-catalog';
          }
          if (id.includes('steamBadgesCatalog')) {
            return 'steam-badges-catalog';
          }
          if (id.includes('node_modules/dexie')) {
            return 'vendor-dexie';
          }
          if (id.includes('node_modules/cropperjs')) {
            return 'vendor-cropper';
          }
          if (id.includes('node_modules/lucide')) {
            return 'vendor-lucide';
          }
          if (id.includes('node_modules/html2canvas')) {
            return 'vendor-html2canvas';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1500
  }
});
