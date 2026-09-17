import https from 'node:https';
import crypto from 'node:crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const agent = new https.Agent({
    rejectUnauthorized: false,
    secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'eqms.doe.gov.my',
      port: 443,
      path: '/api3/publicportalapims/apitablehourly',
      method: 'GET',
      agent,
      headers: {
        'Referer': 'https://eqms.doe.gov.my/APIMS/main',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) UdaraMY/1.0'
      }
    };

    const upstream = https.request(options, (upstreamRes) => {
      let data = '';
      upstreamRes.on('data', chunk => data += chunk);
      upstreamRes.on('end', () => {
        try {
          const json = JSON.parse(data);
          res.setHeader('Content-Type', 'application/json');
          res.status(200).json(json);
          resolve();
        } catch (e) {
          res.status(502).json({ error: 'Failed to parse upstream response', message: e.message });
          resolve();
        }
      });
    });

    upstream.on('error', (err) => {
      res.status(502).json({ error: 'Upstream connection error', message: err.message });
      resolve();
    });

    upstream.setTimeout(12000, () => {
      upstream.destroy();
      res.status(504).json({ error: 'Upstream request timeout' });
      resolve();
    });

    upstream.end();
  });
}
