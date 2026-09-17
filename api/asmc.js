import https from 'node:https';

export default async function handler(req, res) {
  const file = req.query?.file || 'DailyJP1NOAA20.sumatra.txt';
  const allowed = [
    'DailyJP1NOAA20.sumatra.txt',
    'DailyJP1NOAA20.kalimantan.txt',
    'DailyJP1NOAA20.p_malaysia.txt'
  ];

  if (!allowed.includes(file)) {
    return res.status(400).json({ error: 'Invalid file parameter' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return new Promise((resolve) => {
    const options = {
      hostname: 'asmc.asean.org',
      port: 443,
      path: `/files/msscommunity/hotspots/${file}`,
      method: 'GET',
      headers: {
        'Referer': 'https://asmc.asean.org/home/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) UdaraMY/1.0'
      }
    };

    const upstream = https.request(options, (upstreamRes) => {
      let data = '';
      upstreamRes.on('data', chunk => data += chunk);
      upstreamRes.on('end', () => {
        res.setHeader('Content-Type', 'text/plain');
        res.status(upstreamRes.statusCode || 200).send(data);
        resolve();
      });
    });

    upstream.on('error', (err) => {
      res.status(502).json({ error: 'ASMC upstream connection error', message: err.message });
      resolve();
    });

    upstream.setTimeout(10000, () => {
      upstream.destroy();
      res.status(504).json({ error: 'ASMC upstream timeout' });
      resolve();
    });

    upstream.end();
  });
}
