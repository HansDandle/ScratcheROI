import { GameBasicInfo, GameDetailedInfo, PrizeBreakdown, ScrapingStatus } from '../types/lottery';

class LotteryScraper {
  private mainPageUrl = '/export/sites/lottery/Games/Scratch_Offs/all.html';
  private status: ScrapingStatus = {
    isActive: false,
    currentStep: '',
    gamesProcessed: 0,
    totalGames: 0,
    errors: []
  };

  private statusCallbacks: ((status: ScrapingStatus) => void)[] = [];

  onStatusUpdate(callback: (status: ScrapingStatus) => void) {
    this.statusCallbacks.push(callback);
  }

  private updateStatus(updates: Partial<ScrapingStatus>) {
    this.status = { ...this.status, ...updates };
    this.statusCallbacks.forEach(callback => callback(this.status));
  }

  private async fetchWithProxy(url: string): Promise<string> {
    try {
      // Use local API route in dev, full Worker endpoint in prod
      const proxyUrl = import.meta.env.DEV
        ? `/api/lottery-json`
        : 'https://scratchscout-scraper.danshandle.workers.dev/';
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data.games;
    } catch (error) {
      console.error('Fetch error:', error);
      throw new Error(`Failed to fetch from Worker endpoint: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async fetchCachedData(): Promise<GameDetailedInfo[] | null> {
    try {
      const response = await fetch('/.netlify/functions/get-cached-data');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.games || null;
    } catch (error) {
      console.error('Failed to fetch cached data:', error);
      return null;
    }
  }

  private isDataStale(lastUpdated: string): boolean {
    const lastUpdate = new Date(lastUpdated);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    // Consider data stale if it's more than 24 hours old
    return hoursSinceUpdate > 24;
  }

  private parseMainPageTable(html: string): GameBasicInfo[] {
    const games: GameBasicInfo[] = [];
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      // Fallback selectors for main table
      let table = doc.querySelector('table');
      if (!table) table = doc.querySelector('table.large-only');
      if (!table) table = doc.querySelector('table:not([class])');
      if (!table) throw new Error('Main table not found');

      const rows = Array.from(table.querySelectorAll('tbody tr'));
      let i = 0;
      while (i < rows.length) {
        const row = rows[i];
        const cells = row.querySelectorAll('td');
        // Identify a game row by first cell having a link and content
        if (cells.length >= 7 && cells[0].textContent?.trim() && cells[0].querySelector('a')) {
          const gameNumberLink = cells[0].querySelector('a');
          const gameNumber = gameNumberLink?.textContent?.trim() || '';
          const gameUrl = gameNumberLink?.getAttribute('href') || '';
          // Optionally, gather extra info from the next two rows
          let extraRows = [];
          for (let j = 1; j <= 2 && i + j < rows.length; j++) {
            const extraCells = rows[i + j].querySelectorAll('td');
            // Heuristic: extra rows have empty first cell or fewer columns
            if (!extraCells[0].textContent?.trim() || extraCells.length < 7) {
              extraRows.push(extraCells);
            } else {
              break;
            }
          }
          // You can process extraRows here if needed for more details
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
          i += 1 + extraRows.length;
        } else {
          i++;
        }
      }
    } catch (error) {
      throw new Error(`Failed to parse main page: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    return games;
  }

  private parseGameDetailPage(html: string): { totalTickets: number; prizeBreakdown: PrizeBreakdown[]; overallOdds?: string } {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Extract total tickets from text
      let totalTickets = 0;
      const bodyText = doc.body.textContent || '';
      const ticketMatch = bodyText.match(/There are approximately ([\d,]+)\*?\s*tickets/i);
      if (ticketMatch) {
        totalTickets = parseInt(ticketMatch[1].replace(/,/g, ''));
      }

      // Extract overall odds from text
      let overallOdds: string | undefined;
      const oddsMatch = bodyText.match(/Overall odds of winning any prize[^0-9]*are\s+1\s+in\s+([\d.]+)/i);
      if (oddsMatch) {
        overallOdds = `1 in ${oddsMatch[1]}`;
      }

      // Parse prize breakdown table
      const prizeBreakdown: PrizeBreakdown[] = [];
      
      // Look for the "Prizes Printed" table - try multiple selectors
      let table = doc.querySelector('table.large-only');
      if (!table) {
        // Try finding table by looking for "Prizes Printed" header
        const headers = doc.querySelectorAll('h3, h4, th, td');
        for (const header of headers) {
          if (header.textContent?.includes('Prizes Printed')) {
            const closestTable = header.closest('table');
            const parentTable = header.parentElement?.querySelector('table') ?? null;
            table = closestTable || parentTable;
            break;
          }
        }
      }
      
      // If still no table, try finding any table with Amount/No. in Game columns
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
            // Skip empty rows or header rows
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
    } catch (error) {
      throw new Error(`Failed to parse game detail page: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private calculateExpectedValue(prizeBreakdown: PrizeBreakdown[], totalTickets: number, ticketPrice: number): number {
    let expectedValue = 0;
    
    for (const prize of prizeBreakdown) {
      const prizeValue = parseFloat(prize.amount.replace(/[$,]/g, ''));
      const probability = prize.remaining / totalTickets;
      expectedValue += prizeValue * probability;
    }
    
    return expectedValue - ticketPrice;
  }

  private calculateCurrentExpectedValue(prizeBreakdown: PrizeBreakdown[], remainingTickets: number, ticketPrice: number): number {
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

  private calculateRemainingTickets(prizeBreakdown: PrizeBreakdown[], totalTickets: number): number {
    if (prizeBreakdown.length === 0) return totalTickets;
    
    // Find the prize tier with the most total prizes (usually the smallest prize)
    const maxPrizeTier = prizeBreakdown.reduce((max, current) => 
      current.totalInGame > max.totalInGame ? current : max
    );
    
    // Calculate the proportion of tickets sold based on this tier
    const proportionSold = maxPrizeTier.prizesClaimed / maxPrizeTier.totalInGame;
    
    // Apply this proportion to total tickets
    const ticketsSold = Math.round(totalTickets * proportionSold);
    const remainingTickets = Math.max(0, totalTickets - ticketsSold);
    
    return remainingTickets;
  }

  async scrapeAllGames(): Promise<GameDetailedInfo[]> {
    this.updateStatus({
      isActive: true,
      currentStep: 'Fetching main page...',
      gamesProcessed: 0,
      totalGames: 0,
      errors: []
    });

    try {
      // Scrape main page
      const mainPageHtml = await this.fetchWithProxy(this.mainPageUrl);
      const basicGames = this.parseMainPageTable(mainPageHtml);
      
      this.updateStatus({
        totalGames: basicGames.length,
        currentStep: 'Processing individual games...'
      });

      const detailedGames: GameDetailedInfo[] = [];

      const gamesToProcess = basicGames;
      
      for (let i = 0; i < gamesToProcess.length; i++) {
        const game = gamesToProcess[i];
        this.updateStatus({
          currentStep: `Processing game ${game.gameNumber}: ${game.gameName}`,
          gamesProcessed: i
        });

        try {
          const gameUrl = game.gameUrl;
          const gameHtml = await this.fetchWithProxy(gameUrl);
          const { totalTickets, prizeBreakdown, overallOdds: extractedOverallOdds } = this.parseGameDetailPage(gameHtml);
          
          const remainingTickets = this.calculateRemainingTickets(prizeBreakdown, totalTickets);
          const expectedValue = this.calculateExpectedValue(prizeBreakdown, totalTickets, game.ticketPrice);
          const currentExpectedValue = this.calculateCurrentExpectedValue(prizeBreakdown, remainingTickets, game.ticketPrice);
          
          // Calculate odds
          const overallOdds = extractedOverallOdds || (totalTickets > 0 ? `1 in ${Math.round(totalTickets / prizeBreakdown.reduce((sum, p) => sum + p.totalInGame, 0)).toLocaleString()}` : 'N/A');
          const currentOverallOdds = remainingTickets > 0 ? `1 in ${Math.round(remainingTickets / prizeBreakdown.reduce((sum, p) => sum + p.remaining, 0)).toLocaleString()}` : 'N/A';
          
          // Grand prize odds (first prize tier is usually the grand prize)
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
          this.updateStatus({
            errors: [...this.status.errors, `Failed to process game ${game.gameNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`]
          });
        }
      }

      this.updateStatus({
        isActive: false,
        currentStep: `Scraping completed - ${detailedGames.length} games processed successfully`,
        gamesProcessed: gamesToProcess.length
      });

      return detailedGames;
    } catch (error) {
      this.updateStatus({
        isActive: false,
        currentStep: 'Failed',
        errors: [...this.status.errors, error instanceof Error ? error.message : 'Unknown error']
      });
      throw error;
    }
  }

  getStatus(): ScrapingStatus {
    return this.status;
  }
}

export const lotteryScraper = new LotteryScraper();