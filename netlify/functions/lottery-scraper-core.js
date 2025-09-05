const fetch = require('node-fetch');

// Shared scraping logic that can be used by both the proxy and scheduled functions
async function fetchFromLottery(url) {
  const targetUrl = `https://www.texaslottery.com${url}`;
  
  const response = await fetch(targetUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch from Texas Lottery: ${response.status} ${response.statusText}`);
  }

  return await response.text();
}

function parseMainPageTable(html) {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  
  const games = [];
  const table = doc.querySelector('table');
  if (!table) {
    throw new Error('Main table not found');
  }

  const rows = table.querySelectorAll('tbody tr');
  
  for (const row of rows) {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 7 && cells[0].textContent?.trim()) {
      const gameNumberLink = cells[0].querySelector('a');
      if (!gameNumberLink) continue;
      
      const gameNumber = gameNumberLink?.textContent?.trim() || '';
      const gameUrl = gameNumberLink?.getAttribute('href') || '';
      
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

  return games;
}

function parseGameDetailPage(html) {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  
  let totalTickets = 0;
  const bodyText = doc.body.textContent || '';
  const ticketMatch = bodyText.match(/There are approximately ([\d,]+)\*?\s*tickets/i);
  if (ticketMatch) {
    totalTickets = parseInt(ticketMatch[1].replace(/,/g, ''));
  }

  let overallOdds;
  const oddsMatch = bodyText.match(/Overall odds of winning any prize[^0-9]*are\s+1\s+in\s+([\d.]+)/i);
  if (oddsMatch) {
    overallOdds = `1 in ${oddsMatch[1]}`;
  }

  const prizeBreakdown = [];
  
  let table = doc.querySelector('table.large-only');
  if (!table) {
    const headers = doc.querySelectorAll('h3, h4, th, td');
    for (const header of headers) {
      if (header.textContent?.includes('Prizes Printed')) {
        table = header.closest('table') || header.parentElement?.querySelector('table');
        break;
      }
    }
  }
  
  if (!table) {
    const tables = doc.querySelectorAll('table');
    for (const t of tables) {
      const headerText = t.textContent || '';
      if (headerText.includes('Amount') && headerText.includes('No. in Game')) {
        table = t;
        break;
      }
    }
  }
  
  if (table) {
    const rows = table.querySelectorAll('tbody tr');
    
    for (const row of rows) {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 3) {
        const amount = cells[0].textContent?.trim() || '';
        if (!amount || amount.toLowerCase().includes('amount')) continue;
        
        const totalInGame = parseInt(cells[1].textContent?.replace(/,/g, '') || '0');
        const claimedText = cells[2].textContent?.trim() || '0';
        const claimed = claimedText === '---' ? 0 : parseInt(claimedText.replace(/,/g, '') || '0');
        const remaining = totalInGame - claimed;
        const odds = totalTickets > 0 ? `1 in ${Math.round(totalTickets / totalInGame).toLocaleString()}` : 'N/A';
        
        prizeBreakdown.push({
          amount,
          totalInGame,
          prizesClaimed: claimed,
          remaining,
          odds
        });
      }
    }
  }

  return { totalTickets, prizeBreakdown, overallOdds };
}

function calculateExpectedValue(prizeBreakdown, totalTickets, ticketPrice) {
  let expectedValue = 0;
  
  for (const prize of prizeBreakdown) {
    const prizeValue = parseFloat(prize.amount.replace(/[$,]/g, ''));
    const probability = prize.remaining / totalTickets;
    expectedValue += prizeValue * probability;
  }
  
  return expectedValue - ticketPrice;
}

function calculateCurrentExpectedValue(prizeBreakdown, remainingTickets, ticketPrice) {
  let expectedValue = 0;
  
  for (const prize of prizeBreakdown) {
    const prizeValue = parseFloat(prize.amount.replace(/[$,]/g, ''));
    if (remainingTickets > 0) {
      const probability = prize.remaining / remainingTickets;
      expectedValue += prizeValue * probability;
    }
  }
  
  return expectedValue - ticketPrice;
}

function calculateRemainingTickets(prizeBreakdown, totalTickets) {
  if (prizeBreakdown.length === 0) return totalTickets;
  
  const maxPrizeTier = prizeBreakdown.reduce((max, current) => 
    current.totalInGame > max.totalInGame ? current : max
  );
  
  const proportionSold = maxPrizeTier.prizesClaimed / maxPrizeTier.totalInGame;
  const ticketsSold = Math.round(totalTickets * proportionSold);
  const remainingTickets = Math.max(0, totalTickets - ticketsSold);
  
  return remainingTickets;
}

async function scrapeAllGames() {
  const mainPageUrl = '/export/sites/lottery/Games/Scratch_Offs/all.html';
  
  // Scrape main page
  const mainPageHtml = await fetchFromLottery(mainPageUrl);
  const basicGames = parseMainPageTable(mainPageHtml);
  
  const detailedGames = [];
  
  for (const game of basicGames) {
    try {
      const gameHtml = await fetchFromLottery(game.gameUrl);
      const { totalTickets, prizeBreakdown, overallOdds: extractedOverallOdds } = parseGameDetailPage(gameHtml);
      
      const remainingTickets = calculateRemainingTickets(prizeBreakdown, totalTickets);
      const expectedValue = calculateExpectedValue(prizeBreakdown, totalTickets, game.ticketPrice);
      const currentExpectedValue = calculateCurrentExpectedValue(prizeBreakdown, remainingTickets, game.ticketPrice);
      
      const overallOdds = extractedOverallOdds || (totalTickets > 0 ? `1 in ${Math.round(totalTickets / prizeBreakdown.reduce((sum, p) => sum + p.totalInGame, 0)).toLocaleString()}` : 'N/A');
      const currentOverallOdds = remainingTickets > 0 ? `1 in ${Math.round(remainingTickets / prizeBreakdown.reduce((sum, p) => sum + p.remaining, 0)).toLocaleString()}` : 'N/A';
      
      const grandPrize = prizeBreakdown[0];
      const startingGrandPrizeOdds = grandPrize ? `1 in ${Math.round(totalTickets / grandPrize.totalInGame).toLocaleString()}` : 'N/A';
      const currentGrandPrizeOdds = grandPrize && remainingTickets > 0 && grandPrize.remaining > 0 
        ? `1 in ${Math.round(remainingTickets / grandPrize.remaining).toLocaleString()}` 
        : grandPrize && grandPrize.remaining === 0 
        ? 'No prizes left' 
        : 'N/A';

      detailedGames.push({
        ...game,
        totalTickets,
        remainingTickets,
        prizeBreakdown,
        expectedValue,
        currentExpectedValue,
        overallOdds,
        currentOverallOdds,
        startingGrandPrizeOdds,
        currentGrandPrizeOdds,
        lastUpdated: new Date().toISOString()
      });

      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to process game ${game.gameNumber}:`, error);
    }
  }

  return detailedGames;
}

module.exports = {
  scrapeAllGames,
  fetchFromLottery,
  parseMainPageTable,
  parseGameDetailPage
};