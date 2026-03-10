/**
 * Vercel serverless proxy for /api/v1/* to avoid CORS.
 * Forwards requests to Cloud Run API without Origin/Referer headers.
 */
const TARGET = 'https://aim-coach-portal-api-dev-gmgjjvjmpq-nw.a.run.app';

export default async function handler(req, res) {
  const [pathPart, queryPart] = (req.url || req.originalUrl || '').split('?');
  const path = pathPart.replace(/^\/api\/proxy\/?/, '').replace(/^\//, '') || '';
  const query = queryPart ? `?${queryPart}` : '';
  const backendUrl = `${TARGET}/api/v1/${path}${query}`;

  const headers = {};
  ['content-type', 'authorization', 'accept', 'accept-language'].forEach((k) => {
    const v = req.headers[k];
    if (v) headers[k] = Array.isArray(v) ? v[0] : v;
  });

  let body;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  }

  try {
    const backendRes = await fetch(backendUrl, {
      method: req.method,
      headers,
      body,
    });

    const data = await backendRes.text();
    const contentType = backendRes.headers.get('content-type') || 'application/json';

    res.status(backendRes.status).setHeader('Content-Type', contentType);
    return res.send(data);
  } catch (err) {
    console.error('[Proxy] Error:', err.message);
    res.status(502).json({ message: 'Proxy error', error: err.message });
  }
}
