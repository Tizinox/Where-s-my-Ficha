import { defineConfig, type Plugin, type Connect } from 'vite';
import path from 'node:path';

function steamProxyPlugin(): Plugin {
  const handler: Connect.NextHandleFunction = async (req, res) => {
    try {
      const u = new URL(req.url || '/', 'http://localhost');
      const cursor = u.searchParams.get('cursor') || '';
      const count = u.searchParams.get('count') || '1000';
      let targetUrl = `https://api.steampowered.com/ILoyaltyRewardsService/QueryRewardItems/v1/?count=${encodeURIComponent(count)}&community_item_classes[0]=14`;
      if (cursor) {
        targetUrl += `&cursor=${encodeURIComponent(cursor)}`;
      }

      const steamRes = await fetch(targetUrl);
      const data = await steamRes.json();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(JSON.stringify(data));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: message }));
    }
  };

  return {
    name: 'steam-proxy-server',
    configureServer(server) {
      server.middlewares.use('/api/steam-proxy', handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/steam-proxy', handler);
    },
  };
}

function isSafePublicHttpUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
      host === '169.254.169.254'
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function mediaProxyMiddleware(): Connect.NextHandleFunction {
  return async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.statusCode = 204;
      res.end();
      return;
    }

    try {
      const u = new URL(req.url || '/', 'http://localhost');
      const targetUrl = u.searchParams.get('url');
      if (!targetUrl) {
        res.statusCode = 400;
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify({ error: 'Missing url parameter' }));
        return;
      }

      if (!isSafePublicHttpUrl(targetUrl)) {
        res.statusCode = 403;
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify({ error: 'Blocked unsafe or private URL' }));
        return;
      }

      const fetchHeaders: Record<string, string> = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: '*/*',
      };

      if (targetUrl.includes('artstation.com')) {
        fetchHeaders['Referer'] = 'https://www.artstation.com/';
      } else if (targetUrl.includes('pinterest.') || targetUrl.includes('pinimg.com')) {
        fetchHeaders['Referer'] = 'https://www.pinterest.com/';
      } else if (targetUrl.includes('behance.')) {
        fetchHeaders['Referer'] = 'https://www.behance.net/';
      } else if (targetUrl.includes('pximg.net')) {
        fetchHeaders['Referer'] = 'https://www.pixiv.net/';
      }

      const method = req.method === 'HEAD' ? 'HEAD' : 'GET';
      const targetRes = await fetch(targetUrl, {
        method,
        headers: fetchHeaders,
        redirect: 'follow',
        signal: AbortSignal.timeout(12000),
      });

      const contentType = targetRes.headers.get('content-type') || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Expose-Headers', 'X-Final-Url, Content-Type');
      res.setHeader('X-Final-Url', targetRes.url);
      res.setHeader('Cache-Control', 'public, max-age=86400');

      if (!targetRes.ok) {
        res.statusCode = targetRes.status;
      }

      if (method === 'HEAD') {
        res.end();
        return;
      }

      const arrayBuffer = await targetRes.arrayBuffer();
      res.end(Buffer.from(arrayBuffer));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.statusCode = 500;
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: message }));
    }
  };
}

function mediaProxyPlugin(): Plugin {
  const handler = mediaProxyMiddleware();
  return {
    name: 'media-proxy-server',
    configureServer(server) {
      server.middlewares.use('/api/media-proxy', handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/media-proxy', handler);
    },
  };
}

export default defineConfig({
  plugins: [steamProxyPlugin(), mediaProxyPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@app': path.resolve(__dirname, 'src/app'),
      '@core': path.resolve(__dirname, 'src/core'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@ui': path.resolve(__dirname, 'src/ui'),
    },
  },
  optimizeDeps: {
    include: ['alpinejs', '@alpinejs/collapse', 'cropperjs', 'dexie', 'lucide'],
  },
  server: {
    open: true,
    host: true,
    port: 5173,
    strictPort: true,
    hmr: {
      host: 'localhost',
      port: 5173,
      clientPort: 5173,
    },
    watch: {
      ignored: ['**/scratch/**', '**/.git/**', '**/.gemini/**'],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/dexie')) {
            return 'vendor-dexie';
          }
          if (id.includes('node_modules/cropperjs')) {
            return 'vendor-cropper';
          }
          if (id.includes('node_modules/lucide')) {
            return 'vendor-lucide';
          }
          if (id.includes('node_modules/alpinejs')) {
            return 'vendor-alpine';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
});

