import { parseHTML } from 'linkedom';

export default {
  async fetch(request, env, ctx) {
    try {
      const mainUrl = 'https://www.texaslottery.com/export/sites/lottery/Games/Scratch_Offs/all.html';
      const resp = await fetch(mainUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await resp.text();
      const { document } = parseHTML(html);
      // Find the main table using browser-like DOM API
      let table = document.querySelector('table') || document.querySelector('table.large-only') || document.querySelector('table:not([class])');
      if (!table) {
        return new Response(JSON.stringify({ error: 'Main table not found' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
      const rows = Array.from(table.querySelectorAll('tr'));
      const games = [];
      for (let i = 0; i < rows.length; ) {
        const row = rows[i];
        const cells = Array.from(row.querySelectorAll('td'));
        const cell0Text = cells[0] ? (cells[0].textContent || '') : '';
        const gameNumberLink = cells[0] ? cells[0].querySelector('a') : null;
        if (cells.length >= 7 && cell0Text.trim() && gameNumberLink) {
          const gameNumber = (gameNumberLink.textContent || '').trim();
          const gameUrl = gameNumberLink.getAttribute('href') || '';
          let extraRows = [];
          for (let j = 1; j <= 2 && i + j < rows.length; j++) {
            const extraCells = Array.from(rows[i + j].querySelectorAll('td'));
            const extraCell0Text = extraCells[0] ? (extraCells[0].textContent || '') : '';
            if (!extraCell0Text.trim() || extraCells.length < 7) {
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
              // Use linkedom for table parsing
              const { document: detailDoc } = parseHTML(detailHtml);
              let detailTable = detailDoc.querySelector('table.large-only');
              if (!detailTable) {
                const headers = Array.from(detailDoc.querySelectorAll('h3, h4, th, td'));
                for (const header of headers) {
                  if ((header.textContent || '').includes('Prizes Printed')) {
                    const closestTable = header.closest('table');
                    detailTable = closestTable;
                    break;
                  }
                }
              }
              if (!detailTable) {
                const tables = Array.from(detailDoc.querySelectorAll('table'));
                for (const t of tables) {
                  const headerText = t.textContent || '';
                  if (headerText.includes('Amount') && headerText.includes('No. in Game')) {
                    detailTable = t;
                    break;
                  }
                }
              }
              if (detailTable) {
                const detailRows = Array.from(detailTable.querySelectorAll('tr'));
                for (const dRow of detailRows) {
                  const dCells = Array.from(dRow.querySelectorAll('td'));
                  if (dCells.length >= 3) {
                    const amount = dCells[0] ? (dCells[0].textContent || '').trim() : '';
                    if (!amount || amount.toLowerCase().includes('amount')) continue;
                    const totalInGameRaw = dCells[1] ? (dCells[1].textContent || '').replace(/,/g, '').trim() : '';
                    const totalInGame = totalInGameRaw === '---' || totalInGameRaw === '' ? 0 : parseInt(totalInGameRaw);
                    const claimedTextRaw = dCells[2] ? (dCells[2].textContent || '').replace(/,/g, '').trim() : '';
                    const prizesClaimed = claimedTextRaw === '---' || claimedTextRaw === '' ? 0 : parseInt(claimedTextRaw);
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
          // Robustly handle '---' and missing values for all numeric fields
          const startDate = cells[1] ? (cells[1].textContent || '').trim() : '';
          const ticketPriceRaw = cells[2] ? (cells[2].textContent || '').replace('$', '').trim() : '';
          const ticketPrice = ticketPriceRaw === '---' || ticketPriceRaw === '' ? 0 : parseFloat(ticketPriceRaw);
          const gameName = cells[4] ? (cells[4].textContent || '').trim() : '';
          const topPrizeAmount = cells[4] ? (cells[4].textContent || '').trim() : '';
          const prizesPrintedRaw = cells[5] ? (cells[5].textContent || '').replace(/,/g, '').trim() : '';
          const prizesPrinted = prizesPrintedRaw === '---' || prizesPrintedRaw === '' ? 0 : parseInt(prizesPrintedRaw);
          const prizesClaimedRaw = cells[6] ? (cells[6].textContent || '').replace(/,/g, '').trim() : '';
          const prizesClaimed = prizesClaimedRaw === '---' || prizesClaimedRaw === '' ? 0 : parseInt(prizesClaimedRaw);
          games.push({
            gameNumber,
            gameUrl,
            startDate,
            ticketPrice,
            gameName,
            topPrizeAmount,
            prizesPrinted,
            prizesClaimed,
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
