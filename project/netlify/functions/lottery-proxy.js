exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // Extract the path from query parameters
    const path = event.queryStringParameters?.path || '';
    
    if (!path) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Path parameter is required' }),
      };
    }

    // Construct the full URL
    const targetUrl = `https://www.texaslottery.com${path}`;
    
    // Fetch from Texas Lottery website
    const response = await fetch(targetUrl, {
      method: event.httpMethod,
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
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: `Failed to fetch from Texas Lottery: ${response.status} ${response.statusText}` 
        }),
      };
    }

    const data = await response.text();

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'text/html; charset=utf-8',
      },
      body: data,
    };
  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
    };
  }
};