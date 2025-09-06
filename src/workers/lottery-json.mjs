import { parseDocument } from 'htmlparser2';
import { DomUtils } from 'htmlparser2';

export default {
  async fetch(request, env, ctx) {
    try {
      const mainUrl = 'https://www.texaslottery.com/export/sites/lottery/Games/Scratch_Offs/all.html';
      const resp = await fetch(mainUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await resp.text();
      const doc = parseDocument(html);
      // Find the main table using htmlparser2 utilities
      let table = DomUtils.findOne(el => el.name === 'table', doc.children);
      if (!table) table = DomUtils.findOne(el => el.name === 'table' && el.attribs && el.attribs.class === 'large-only', doc.children);
      if (!table) table = DomUtils.findOne(el => el.name === 'table' && !el.attribs?.class, doc.children);
      if (!table) {
        return new Response(JSON.stringify({ error: 'Main table not found' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
      const rows = DomUtils.findAll(el => el.name === 'tr', table.children);
      const games = [];
      for (let i = 0; i < rows.length; ) {
        const row = rows[i];
        const cells = DomUtils.findAll(el => el.name === 'td', row.children);
  const cell0Text = cells[0] ? (DomUtils.textContent(cells[0]) || '') : '';
  const hasGameLink = cells[0] ? DomUtils.findOne(el => el.name === 'a', cells[0].children || []) : null;
  if (cells.length >= 7 && cell0Text.trim() && hasGameLink) {
          const gameNumberLink = hasGameLink;
          const gameNumber = (DomUtils.textContent(gameNumberLink) || '').trim();
          const gameUrl = gameNumberLink?.attribs?.href || '';
          let extraRows = [];
          for (let j = 1; j <= 2 && i + j < rows.length; j++) {
            const extraCells = DomUtils.findAll(el => el.name === 'td', rows[i + j].children);
            const extraCell0Text = extraCells[0] ? (DomUtils.textContent(extraCells[0]) || '') : '';
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
              // Use htmlparser2 for table parsing
              const detailDoc = parseDocument(detailHtml);
              let detailTable = DomUtils.findOne(el => el.name === 'table' && el.attribs && el.attribs.class === 'large-only', detailDoc.children);
              if (!detailTable) {
                const headers = DomUtils.findAll(el => ['h3','h4','th','td'].includes(el.name), detailDoc.children);
                for (const header of headers) {
                  if (DomUtils.textContent(header).includes('Prizes Printed')) {
                    const closestTable = DomUtils.findOne(el => el.name === 'table', [header.parent]);
                    detailTable = closestTable;
                    break;
                  }
                }
              }
              if (!detailTable) {
                const tables = DomUtils.findAll(el => el.name === 'table', detailDoc.children);
                for (const t of tables) {
                  const headerText = DomUtils.textContent(t) || '';
                  if (headerText.includes('Amount') && headerText.includes('No. in Game')) {
                    detailTable = t;
                    break;
                  }
                }
              }
              if (detailTable) {
                const detailRows = DomUtils.findAll(el => el.name === 'tr', detailTable.children);
                for (const dRow of detailRows) {
                  const dCells = DomUtils.findAll(el => el.name === 'td', dRow.children);
                  if (dCells.length >= 3) {
                    const amount = dCells[0] ? (DomUtils.textContent(dCells[0]) || '').trim() : '';
                    if (!amount || amount.toLowerCase().includes('amount')) continue;
                    const totalInGameRaw = dCells[1] ? (DomUtils.textContent(dCells[1]) || '').replace(/,/g, '').trim() : '';
                    const totalInGame = totalInGameRaw === '---' || totalInGameRaw === '' ? 0 : parseInt(totalInGameRaw);
                    const claimedTextRaw = dCells[2] ? (DomUtils.textContent(dCells[2]) || '').replace(/,/g, '').trim() : '';
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
          const startDate = cells[1] ? (DomUtils.textContent(cells[1]) || '').trim() : '';
          const ticketPriceRaw = cells[2] ? (DomUtils.textContent(cells[2]) || '').replace('$', '').trim() : '';
          const ticketPrice = ticketPriceRaw === '---' || ticketPriceRaw === '' ? 0 : parseFloat(ticketPriceRaw);
          const gameName = cells[4] ? (DomUtils.textContent(cells[4]) || '').trim() : '';
          const topPrizeAmount = cells[4] ? (DomUtils.textContent(cells[4]) || '').trim() : '';
          const prizesPrintedRaw = cells[5] ? (DomUtils.textContent(cells[5]) || '').replace(/,/g, '').trim() : '';
          const prizesPrinted = prizesPrintedRaw === '---' || prizesPrintedRaw === '' ? 0 : parseInt(prizesPrintedRaw);
          const prizesClaimedRaw = cells[6] ? (DomUtils.textContent(cells[6]) || '').replace(/,/g, '').trim() : '';
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
