import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fetchProxiedResource, isValidTargetUrl } from './lib/htmlProxy';

function readRequestBody(req: import('http').IncomingMessage): Promise<Buffer | null> {
  return new Promise((resolve, reject) => {
    if (req.method === 'GET' || req.method === 'HEAD') {
      resolve(null);
      return;
    }

    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(chunks.length ? Buffer.concat(chunks) : null));
    req.on('error', reject);
  });
}

function devProxyPlugin(): Plugin {
  return {
    name: 'pixelmatch-dev-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/proxy')) {
          next();
          return;
        }

        const url = new URL(req.url, 'http://localhost');
        const targetUrl = url.searchParams.get('url');

        if (!targetUrl || !isValidTargetUrl(targetUrl)) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing or invalid url parameter' }));
          return;
        }

        try {
          const body = await readRequestBody(req);
          const { body: responseBody, contentType, status } = await fetchProxiedResource(
            targetUrl,
            {
              method: req.method,
              headers: req.headers as Record<string, string | string[] | undefined>,
              body,
            }
          );

          res.statusCode = status;
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'no-cache');
          res.end(responseBody);
        } catch {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Failed to fetch the target URL' }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), devProxyPlugin()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
