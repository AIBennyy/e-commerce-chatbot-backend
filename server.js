/**
 * E-Commerce Proxy Server - Modified for Heroku Deployment
 * 
 * This server acts as a proxy between the chatbot interface and e-commerce websites.
 * It handles authentication, request formatting, and error handling for API calls.
 */

// Import required modules
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const winston = require('winston');
require('dotenv').config();

// Create Express app
const app = express();

// Configure CORS for production
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['https://e-commerce-chatbot-demo.vercel.app'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `${timestamp} ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'proxy-server.log' })
  ]
});

// Store supported e-commerce platforms
const PLATFORMS = {
  MOTONET: 'motonet',
  RUSTA: 'rusta'
};

// Default platform
let currentPlatform = PLATFORMS.MOTONET;

/**
 * Get configuration for the current platform
 */
function getPlatformConfig() {
  switch (currentPlatform) {
    case PLATFORMS.MOTONET:
      return {
        baseUrl: process.env.MOTONET_URL || 'https://www.motonet.fi',
        cartAddEndpoint: process.env.MOTONET_API_CART_ADD || '/api/cart/add',
        cookie: process.env.MOTONET_COOKIE,
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          'Origin': process.env.MOTONET_URL || 'https://www.motonet.fi',
          'Referer': (process.env.MOTONET_URL || 'https://www.motonet.fi') + '/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Cookie': process.env.MOTONET_COOKIE,
          'Connection': 'keep-alive',
          'X-Requested-With': 'XMLHttpRequest'
        }
      };
    case PLATFORMS.RUSTA:
      return {
        baseUrl: process.env.RUSTA_URL || 'https://www.rusta.com/fi',
        cartAddEndpoint: process.env.RUSTA_API_CART_ADD || '/api/cart/add',
        cookie: process.env.RUSTA_COOKIE,
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          'Origin': process.env.RUSTA_URL || 'https://www.rusta.com/fi',
          'Referer': (process.env.RUSTA_URL || 'https://www.rusta.com/fi') + '/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Cookie': process.env.RUSTA_COOKIE,
          'Connection': 'keep-alive',
          'X-Requested-With': 'XMLHttpRequest'
        }
      };
    default:
      throw new Error(`Unsupported platform: ${currentPlatform}`);
  }
}

/**
 * Switch the current e-commerce platform
 */
app.post('/api/switch-platform', (req, res) => {
  const { platform } = req.body;
  
  if (!platform || !Object.values(PLATFORMS).includes(platform)) {
    return res.status(400).json({ 
      error: 'Invalid platform', 
      supportedPlatforms: Object.values(PLATFORMS) 
    });
  }
  
  currentPlatform = platform;
  logger.info(`Switched to platform: ${platform}`);
  
  res.json({ success: true, currentPlatform });
});

/**
 * Add item to cart
 */
app.post('/api/add-to-cart', async (req, res) => {
  const { productId, quantity } = req.body;
  
  if (!productId || !quantity) {
    logger.error('Missing productId or quantity in request');
    return res.status(400).json({ error: 'Missing productId or quantity in request' });
  }
  
  try {
    logger.info(`Adding product ${productId} (qty: ${quantity}) to cart on ${currentPlatform}`);
    
    const config = getPlatformConfig();
    
    if (!config.cookie) {
      logger.error(`Missing cookie for ${currentPlatform}`);
      return res.status(500).json({ 
        error: `Missing cookie for ${currentPlatform}`,
        solution: 'Please update the environment variables with valid cookies extracted from browser'
      });
    }
    
    const targetUrl = `${config.baseUrl}${config.cartAddEndpoint}`;
    
    // Add retry logic with exponential backoff
    let retries = 3;
    let lastError = null;
    
    while (retries > 0) {
      try {
        logger.info(`Sending request to ${targetUrl} (attempt ${4-retries}/3)`);
        
        const response = await axios({
          method: 'post',
          url: targetUrl,
          headers: config.headers,
          data: { productId, quantity },
          timeout: 10000
        });
        
        logger.info(`Response status: ${response.status}`);
        
        return res.json({
          success: true,
          platform: currentPlatform,
          response: response.data
        });
      } catch (error) {
        lastError = error;
        logger.error(`Request failed (attempt ${4-retries}/3): ${error.message}`);
        
        if (error.response) {
          logger.error(`Response status: ${error.response.status}`);
          logger.error(`Response headers: ${JSON.stringify(error.response.headers)}`);
          
          // If we get a response, even an error one, break the retry loop
          // as it might be an authentication issue that won't be fixed by retrying
          if (error.response.status === 503) {
            logger.error('Service unavailable (503) - likely an authentication issue');
            break;
          }
        }
        
        retries--;
        if (retries > 0) {
          const delay = (4 - retries) * 1000; // Exponential backoff
          logger.info(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If we get here, all retries failed
    const errorResponse = {
      error: 'Failed to add item to cart',
      platform: currentPlatform,
      details: lastError.message
    };
    
    if (lastError.response) {
      errorResponse.statusCode = lastError.response.status;
      errorResponse.responseData = lastError.response.data;
      
      // Try to extract more meaningful error message from HTML response
      if (typeof lastError.response.data === 'string' && 
          lastError.response.data.includes('<title>') && 
          lastError.response.data.includes('</title>')) {
        const titleMatch = lastError.response.data.match(/<title>(.*?)<\/title>/);
        if (titleMatch && titleMatch[1]) {
          errorResponse.errorTitle = titleMatch[1];
        }
      }
    }
    
    logger.error(`Final error response: ${JSON.stringify(errorResponse)}`);
    return res.status(500).json(errorResponse);
    
  } catch (error) {
    logger.error(`Unexpected error: ${error.message}`);
    return res.status(500).json({ 
      error: 'Unexpected error occurred', 
      details: error.message 
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    currentPlatform,
    cookieStatus: {
      [PLATFORMS.MOTONET]: !!process.env.MOTONET_COOKIE,
      [PLATFORMS.RUSTA]: !!process.env.RUSTA_COOKIE
    }
  });
});

// For demo purposes, add a root route
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>E-Commerce Chatbot API</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #4a6fa5; }
          .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
          code { background: #e0e0e0; padding: 2px 5px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <h1>E-Commerce Chatbot API</h1>
        <p>This is the backend API for the E-Commerce Chatbot. The frontend interface is available at 
           <a href="https://e-commerce-chatbot-demo.vercel.app" target="_blank">https://e-commerce-chatbot-demo.vercel.app</a>.</p>
        
        <h2>Available Endpoints:</h2>
        
        <div class="endpoint">
          <h3>GET /health</h3>
          <p>Check the health status of the API and cookie configuration.</p>
        </div>
        
        <div class="endpoint">
          <h3>POST /api/switch-platform</h3>
          <p>Switch between supported e-commerce platforms.</p>
          <p>Payload: <code>{ "platform": "motonet" }</code> or <code>{ "platform": "rusta" }</code></p>
        </div>
        
        <div class="endpoint">
          <h3>POST /api/add-to-cart</h3>
          <p>Add a product to the shopping cart.</p>
          <p>Payload: <code>{ "productId": "59-5064", "quantity": 1 }</code></p>
        </div>
      </body>
    </html>
  `);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Proxy server running on port ${PORT}`);
  logger.info(`Current platform: ${currentPlatform}`);
});
