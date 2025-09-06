import { parse } from 'node-html-parser';

export default {
  async fetch(request, env, ctx) {
    try {
      const mainUrl = 'https://www.texaslottery.com/export/sites/lottery/Games/Scratch_Offs/all.html';
      const resp = await fetch(mainUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await resp.text();
      const doc = parse(html);
      let table = doc.querySelector('table');
      if (!table) table = doc.querySelector('table.large-only');
      if (!table) table = doc.querySelector('table:not([class])');
      if (!table) {
        return new Response(JSON.stringify({ error: 'Main table not found' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
      const rows = table.querySelectorAll('tr');
      const games = [];
      for (let i = 0; i < rows.length; ) {
        const row = rows[i];
        const cells = row.querySelectorAll('td');
        if (cells.length >= 7 && cells[0].text.trim() && cells[0].querySelector('a')) {
          const gameNumberLink = cells[0].querySelector('a');
          const gameNumber = gameNumberLink?.text.trim() || '';
          const gameUrl = gameNumberLink?.getAttribute('href') || '';
          let extraRows = [];
          for (let j = 1; j <= 2 && i + j < rows.length; j++) {
            const extraCells = rows[i + j].querySelectorAll('td');
            if (!extraCells[0].text.trim() || extraCells.length < 7) {
              extraRows.push(extraCells);
            } else {
              break;
            }
          }
          // Fetch and parse game detail page
          let totalTickets = 0;
          let overallOdds = '';
          let prizeBreakdown = [];
          try {
            if (gameUrl) {
              const detailResp = await fetch('https://www.texaslottery.com' + gameUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
              const detailHtml = await detailResp.text();
              // Use raw HTML for regex extraction
              const ticketMatch = detailHtml.match(/There are approximately ([\d,]+)\*?\s*tickets/i);
              if (ticketMatch) {
                totalTickets = parseInt(ticketMatch[1].replace(/,/g, ''));
              }
              const oddsMatch = detailHtml.match(/Overall odds of winning any prize[^0-9]*are\s+1\s+in\s+([\d.]+)/i);
              if (oddsMatch) {
                overallOdds = `1 in ${oddsMatch[1]}`;
              }
              // Continue to use node-html-parser for table parsing
              const detailDoc = parse(detailHtml);
              let detailTable = detailDoc.querySelector('table.large-only');
              if (!detailTable) {
                const headers = detailDoc.querySelectorAll('h3, h4, th, td');
                for (const header of headers) {
                  if (header.text.includes('Prizes Printed')) {
                    const closestTable = header.closest('table');
                    const parentTable = header.parentNode?.querySelector('table') ?? null;
                    detailTable = closestTable || parentTable;
                    break;
                  }
                }
              }
              if (!detailTable) {
                const tables = detailDoc.querySelectorAll('table');
                for (const t of tables) {
                  const headerText = t.text || '';
                  if (headerText.includes('Amount') && headerText.includes('No. in Game')) {
                    detailTable = t;
                    break;
                  }
                }
              }
              if (detailTable) {
                const detailRows = detailTable.querySelectorAll('tr');
                for (const dRow of detailRows) {
                  const dCells = dRow.querySelectorAll('td');
                  if (dCells.length >= 3) {
                    const amount = dCells[0].text.trim() || '';
                    if (!amount || amount.toLowerCase().includes('amount')) continue;
                    const totalInGame = parseInt(dCells[1].text.replace(/,/g, '') || '0');
                    const claimedText = dCells[2].text.trim() || '0';
                    const prizesClaimed = claimedText === '---' ? 0 : parseInt(claimedText.replace(/,/g, '') || '0');
                    const remaining = totalInGame - prizesClaimed;
                    const odds = totalTickets > 0 ? `1 in ${Math.round(totalTickets / totalInGame).toLocaleString()}` : 'N/A';
                    prizeBreakdown.push({ amount, totalInGame, prizesClaimed, remaining, odds });
                  }
                }
              }
            }
          } catch (err) {
            // If detail page fails, continue with basic info
          }
          games.push({
            gameNumber,
            gameUrl,
            startDate: cells[1].text.trim() || '',
            ticketPrice: parseFloat(cells[2].text.replace('$', '') || '0'),
            gameName: cells[4].text.trim() || '',
            topPrizeAmount: cells[4].text.trim() || '',
            prizesPrinted: parseInt(cells[5].text.replace(/,/g, '') || '0'),
            prizesClaimed: cells[6].text.trim() === '---' ? 0 : parseInt(cells[6].text.replace(/,/g, '') || '0'),
            totalTickets,
            overallOdds,
            prizeBreakdown
          });
          i += 1 + extraRows.length;
        } else {
          i++;
        }
      }
      return new Response(JSON.stringify({ games }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }
};
