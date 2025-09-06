export default {
  async fetch(request, env, ctx) {
    // Fetch and parse the Texas Lottery scratch-off main page
    const mainUrl = 'https://www.texaslottery.com/export/sites/lottery/Games/Scratch_Offs/all.html';
    const resp = await fetch(mainUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await resp.text();
    // Parse the HTML using DOMParser (Cloudflare Workers support it)
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const table = doc.querySelector('table');
    if (!table) {
      return new Response(JSON.stringify({ error: 'Main table not found' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    const rows = table.querySelectorAll('tbody tr');
    const games = [];
    for (const row of rows) {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 7 && cells[0].textContent?.trim()) {
        const gameNumberLink = cells[0].querySelector('a');
        if (!gameNumberLink) continue;
        const gameNumber = gameNumberLink.textContent.trim();
        const gameUrl = gameNumberLink.getAttribute('href');
        games.push({
          gameNumber,
          gameUrl,
          startDate: cells[1].textContent?.trim() || '',
          ticketPrice: parseFloat(cells[2].textContent?.replace('$', '') || '0'),
          gameName: cells[4].textContent?.trim() || '',
          topPrizeAmount: cells[4].textContent?.trim() || '',
          prizesPrinted: parseInt(cells[5].textContent?.replace(/,/g, '') || '0'),
          prizesClaimed: cells[6].textContent?.trim() === '---' ? 0 : parseInt(cells[6].textContent?.replace(/,/g, '') || '0')
        });
      }
    }
    return new Response(JSON.stringify({ games }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
};
