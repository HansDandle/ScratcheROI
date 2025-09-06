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
    // In a real implementation, you'd fetch this from a database or file storage
    // For now, we'll trigger a fresh scrape if no cached data exists
    // This is a fallback - ideally the scheduled function would populate a database
    
    const { scrapeAllGames } = require('./lottery-scraper-core');
    
    // Check if we should return cached data or fresh data
    // You could implement caching logic here with a database or file storage
    
    console.log('Fetching fresh lottery data...');
    const games = await scrapeAllGames();
    
    const result = {
      games,
      lastUpdated: new Date().toISOString(),
      totalGames: games.length,
      cached: false
    };
    
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