export default {
  async fetch(request, env, ctx) {
    // Proxy endpoint for frontend to request lottery data
    const url = new URL(request.url);
    const targetPath = url.searchParams.get('path');
    if (!targetPath) {
      return new Response(JSON.stringify({ error: 'Missing path parameter' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const targetUrl = `https://www.texaslottery.com${targetPath}`;
    const resp = await fetch(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await resp.text();
    return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html' } });
  }
};
