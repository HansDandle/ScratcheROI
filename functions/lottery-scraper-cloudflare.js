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
    return [{ error: 'Main page did not return HTML', url: mainPageUrl, htmlSnippet: html?.slice(0, 100) }];
  }
  const { document } = parseHTML(html);

  // Find the main table
  let table = document.querySelector('table');
  if (!table) table = document.querySelector('table.large-only');
  if (!table) table = document.querySelector('table:not([class])');
  if (!table) {
    return [{ error: 'Main table not found', url: mainPageUrl, htmlSnippet: html.slice(0, 500) }];
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

  // Fetch details for each game with error handling
  const detailedGames = [];
  for (const game of games) {
    try {
      const detailUrl = 'https://www.texaslottery.com' + game.gameUrl;
      const detailResp = await fetch(detailUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!detailResp.ok) {
        throw new Error(`Detail page fetch failed: HTTP ${detailResp.status}`);
      }
      const detailHtml = await detailResp.text();
      const { document: detailDoc } = parseHTML(detailHtml);
      let totalTickets = 0;
      let overallOdds = 'N/A';
      const bodyText = detailDoc.body.textContent || '';
      const ticketMatch = bodyText.match(/There are approximately ([\d,]+)\*?\s*tickets/i);
      if (ticketMatch) {
        totalTickets = parseInt(ticketMatch[1].replace(/,/g, ''));
      }
      const oddsMatch = bodyText.match(/Overall odds of winning any prize[^0-9]*are\s+1\s+in\s+([\d.]+)/i);
      if (oddsMatch) {
        overallOdds = `1 in ${oddsMatch[1]}`;
      }
      detailedGames.push({
        ...game,
        totalTickets,
        overallOdds
      });
      await new Promise(resolve => setTimeout(resolve, 250));
    } catch (error) {
      detailedGames.push({ ...game, error: error.message });
    }
  }
  return detailedGames;
}
