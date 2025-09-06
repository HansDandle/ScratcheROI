// netlify-scheduled-function: 0 12 * * *
const fetch = require('node-fetch');

// This function runs daily at 6 AM CST (12 PM UTC)
exports.handler = async (event, context) => {
  console.log('Starting scheduled lottery data scrape...');
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  try {
    // Import the scraping logic
    const { scrapeAllGames } = require('./lottery-scraper-core');
    
    // Perform the scraping
    const games = await scrapeAllGames();
    
    // Save cache to /tmp/lottery-cache.json
    const fs = require('fs');
    const cachePath = '/tmp/lottery-cache.json';
    const result = {
      games,
      lastUpdated: new Date().toISOString(),
      totalGames: games.length
    };
    try {
      fs.writeFileSync(cachePath, JSON.stringify(result));
      console.log('Cache written to', cachePath);
    } catch (err) {
      console.error('Failed to write cache:', err);
    }
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Successfully scraped ${games.length} games`,
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('Scheduled scraping failed:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};