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
    
    // Store the data (you could use a database here, but for now we'll return it)
    // In a real implementation, you'd store this in a database or file storage
    const result = {
      games,
      lastUpdated: new Date().toISOString(),
      totalGames: games.length
    };
    
    console.log(`Successfully scraped ${games.length} games`);
    
    // You could store this in Netlify's environment variables, a database, or file storage
    // For now, we'll just log success
    
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