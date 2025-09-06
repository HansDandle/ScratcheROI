// Cloudflare-compatible lottery scraper (ESM, browser APIs)
import { parseHTML } from 'linkedom';

export async function scrapeAllGames() {
  // Fetch main page
  const mainPageUrl = 'https://www.texaslottery.com/export/sites/lottery/Games/Scratch_Offs/all.html';
  const resp = await fetch(mainPageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await resp.text();
  const { document } = parseHTML(html);

  // Find the main table
  let table = document.querySelector('table');
  if (!table) table = document.querySelector('table.large-only');
  if (!table) table = document.querySelector('table:not([class])');
  if (!table) throw new Error('Main table not found');

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

  // Fetch details for each game
  const detailedGames = [];
  for (const game of games) {
    try {
      const detailResp = await fetch('https://www.texaslottery.com' + game.gameUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const detailHtml = await detailResp.text();
      const { document: detailDoc } = parseHTML(detailHtml);
      // Example: extract total tickets and overall odds from detail page
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
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 250));
    } catch (error) {
      detailedGames.push({ ...game, error: error.message });
    }
  }
  return detailedGames;
}
