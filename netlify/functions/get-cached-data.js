// Function to serve cached lottery data
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const fs = require('fs');
    const cachePath = '/tmp/lottery-cache.json';
    let result = null;
    if (fs.existsSync(cachePath)) {
      const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      // Check if cache is less than 24 hours old
      const lastUpdate = new Date(cacheData.lastUpdated);
      const now = new Date();
      const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
      if (hoursSinceUpdate < 24) {
        result = { ...cacheData, cached: true };
        console.log('Serving cached lottery data');
      }
    }
    if (!result) {
      // No valid cache, scrape fresh
      const { scrapeAllGames } = require('./lottery-scraper-core');
      console.log('Fetching fresh lottery data...');
      const games = await scrapeAllGames();
      result = {
        games,
        lastUpdated: new Date().toISOString(),
        totalGames: games.length,
        cached: false
      };
      // Optionally update cache here as well
      try {
        fs.writeFileSync(cachePath, JSON.stringify(result));
        console.log('Cache updated after fresh scrape');
      } catch (err) {
        console.error('Failed to update cache:', err);
      }
    }
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
    
  } catch (error) {
    console.error('Failed to get lottery data:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch lottery data',
        details: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};