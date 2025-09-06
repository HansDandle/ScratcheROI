// Cloudflare Pages Function for lottery-scraper
import { scrapeAllGames } from '../lottery-scraper-cloudflare.js';

export async function onRequest(context) {
  try {
    const games = await scrapeAllGames();
    return new Response(
      JSON.stringify({ success: true, games }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
