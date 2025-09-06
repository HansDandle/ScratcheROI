// Cloudflare-compatible lottery scraper (ESM, browser APIs)
import { parseHTML } from 'linkedom';

export async function scrapeAllGames() {
  // Fetch main page with logging
  const mainPageUrl = 'https://www.texaslottery.com/export/sites/lottery/Games/Scratch_Offs/all.html';
  let resp, html;
  try {
    resp = await fetch(mainPageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!resp.ok) {
      throw new Error(`Main page fetch failed: HTTP ${resp.status}`);
    }
    html = await resp.text();
  } catch (err) {
    return [{ error: `Failed to fetch main page: ${err.message}`, url: mainPageUrl }];
  }
  // Log a snippet of the HTML for debugging
  if (!html || !html.startsWith('<!DOCTYPE html')) {
    return [{
      error: 'Main page did not return HTML',
      url: mainPageUrl,
      htmlSnippet: html?.slice(0, 2000),
      fullHtmlLength: html?.length,
      receivedHeaders: resp?.headers ? Object.fromEntries(resp.headers.entries()) : undefined
    }];
  }
  const { document } = parseHTML(html);

  // Find the main table
  let table = document.querySelector('table');
  if (!table) table = document.querySelector('table.large-only');
  if (!table) table = document.querySelector('table:not([class])');
  if (!table) {
    return [{
      error: 'Main table not found',
      url: mainPageUrl,
      htmlSnippet: html.slice(0, 5000),
      fullHtmlLength: html.length,
      receivedHeaders: resp.headers ? Object.fromEntries(resp.headers.entries()) : undefined
    }];
  }

  const rows = Array.from(table.querySelectorAll('tbody tr'));
  const games = [];
  for (const row of rows) {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 7 && cells[0].textContent.trim()) {
      const gameNumberLink = cells[0].querySelector('a');
      if (!gameNumberLink) continue;
      const gameNumber = gameNumberLink.textContent.trim();
      const gameUrl = gameNumberLink.getAttribute('href');
      games.push({
        gameNumber,
        gameUrl,
        startDate: cells[1].textContent.trim(),
        ticketPrice: parseFloat(cells[2].textContent.replace('$', '') || '0'),
        gameName: cells[4].textContent.trim(),
        topPrizeAmount: cells[4].textContent.trim(),
        prizesPrinted: parseInt(cells[5].textContent.replace(/,/g, '') || '0'),
        prizesClaimed: cells[6].textContent.trim() === '---' ? 0 : parseInt(cells[6].textContent.replace(/,/g, '') || '0')
      });
    }
  }

  // Return only main table data to avoid Worker timeouts
  return games;
}
