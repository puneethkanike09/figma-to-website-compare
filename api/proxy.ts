import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchProxiedResource, isValidTargetUrl } from '../lib/htmlProxy';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readBody(req: VercelRequest): Promise<Buffer | null> {
  if (req.method === 'GET' || req.method === 'HEAD') return null;

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(chunks.length ? Buffer.concat(chunks) : null));
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const targetUrl = typeof req.query.url === 'string' ? req.query.url : null;
  if (!targetUrl || !isValidTargetUrl(targetUrl)) {
    return res.status(400).json({ error: 'Missing or invalid url parameter' });
  }

  try {
    const body = await readBody(req);
    const { body: responseBody, contentType, status } = await fetchProxiedResource(
      targetUrl,
      {
        method: req.method,
        headers: req.headers as Record<string, string | string[] | undefined>,
        body,
      }
    );

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");

    return res.status(status).send(responseBody);
  } catch {
    return res.status(502).json({ error: 'Failed to fetch the target URL' });
  }
}
