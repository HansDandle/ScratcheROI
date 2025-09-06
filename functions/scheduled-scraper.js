// Cloudflare Pages Function: scheduled-scraper
import { scrapeAllGames } from './lottery-scraper-cloudflare.js';

export async function onRequest(context) {
  try {
    // Perform the scraping
    const games = await scrapeAllGames();
    const result = {
      games,
      lastUpdated: new Date().toISOString(),
      totalGames: games.length
    };
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully scraped ${games.length} games`,
        timestamp: new Date().toISOString(),
        data: result
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
