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
require('dotenv').config();

// Import the dashboard API module
const dashboardApi = require('./dashboard-api');

// Import the error monitoring system
const errorMonitoring = require('./error-monitoring');

// Create Express app
const app = express();

// Configure CORS for production
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['https://e-commerce-chatbot-frontend.vercel.app'];

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

// Add request logging middleware
app.use(errorMonitoring.createRequestLoggerMiddleware());

// Configure logger - use the enhanced logger from error monitoring
const logger = errorMonitoring.logger;

// Store supported e-commerce platforms
const PLATFORMS = {
  MOTONET: 'motonet',
  RUSTA: 'rusta',
  SRYHMA: 'sryhma',
  GIGANTTI: 'gigantti'
};

// Default platform
let currentPlatform = PLATFORMS.MOTONET;

// Add the dashboard API routes
app.use('/api/dashboard', dashboardApi.router);

// Middleware to log API operations for dashboard monitoring
app.use((req, res, next) => {
  const originalSend = res.send;
  const start = Date.now();
  
  res.send = function(data) {
    const responseTime = Date.now() - start;
    const platform = req.body?.platform || currentPlatform;
    const operation = req.path;
    
    if (res.statusCode >= 400) {
      dashboardApi.logError(platform, operation, `HTTP ${res.statusCode}: ${data}`);
    } else {
      dashboardApi.logSuccess(platform, operation, responseTime);
    }
    
    return originalSend.apply(res, arguments);
  };
  
  next();
});

/**
 * Process cookie string to ensure it's properly formatted
 * This function removes any quotes and ensures the cookie is properly formatted
 */
function processCookieString(cookieStr) {
  if (!cookieStr) return '';
  
  // Remove any surrounding quotes if present
  let processed = cookieStr.trim();
  if ((processed.startsWith('"') && processed.endsWith('"')) || 
      (processed.startsWith("'") && processed.endsWith("'"))) {
    processed = processed.substring(1, processed.length - 1);
  }
  
  // Ensure there are no invalid characters
  processed = processed.replace(/[\r\n]/g, '');
  
  return processed;
}

/**
 * Get configuration for the current platform
 */
function getPlatformConfig() {
  switch (currentPlatform) {
    case PLATFORMS.MOTONET:
      // Process the cookie string to ensure it's properly formatted
      const motonetCookie = processCookieString(process.env.MOTONET_COOKIE);
      
      return {
        baseUrl: process.env.MOTONET_URL || 'https://www.motonet.fi',
        // Updated to use the correct endpoint for Motonet
        cartAddEndpoint: process.env.MOTONET_API_CART_ADD || '/api/tracking/add-to-cart',
        cookie: motonetCookie,
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          'Origin': process.env.MOTONET_URL || 'https://www.motonet.fi',
          'Referer': (process.env.MOTONET_URL || 'https://www.motonet.fi') + '/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Cookie': motonetCookie, // Use the processed cookie string
          'Connection': 'keep-alive',
          'X-Requested-With': 'XMLHttpRequest'
        }
      };
    case PLATFORMS.RUSTA:
      // Process the cookie string to ensure it's properly formatted
      const rustaCookie = processCookieString(process.env.RUSTA_COOKIE);
      
      return {
        baseUrl: process.env.RUSTA_URL || 'https://www.rusta.com/fi',
        cartAddEndpoint: process.env.RUSTA_API_CART_ADD || '/api/cart/add',
        cookie: rustaCookie,
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          'Origin': process.env.RUSTA_URL || 'https://www.rusta.com/fi',
          'Referer': (process.env.RUSTA_URL || 'https://www.rusta.com/fi') + '/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Cookie': rustaCookie, // Use the processed cookie string
          'Connection': 'keep-alive',
          'X-Requested-With': 'XMLHttpRequest'
        }
      };
    case PLATFORMS.SRYHMA:
      // Process the cookie string to ensure it's properly formatted
      const sryhmaCookie = processCookieString(process.env.SRYHMA_COOKIE);
      
      return {
        baseUrl: process.env.SRYHMA_URL || 'https://www.s-kaupat.fi',
        cartAddEndpoint: process.env.SRYHMA_API_CART_ADD || '/api/cart/add',
        cookie: sryhmaCookie,
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          'Origin': process.env.SRYHMA_URL || 'https://www.s-kaupat.fi',
          'Referer': (process.env.SRYHMA_URL || 'https://www.s-kaupat.fi') + '/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Cookie': sryhmaCookie,
          'Connection': 'keep-alive',
          'X-Requested-With': 'XMLHttpRequest'
        }
      };
    case PLATFORMS.GIGANTTI:
      // Process the cookie string to ensure it's properly formatted
      const giganttCookie = processCookieString(process.env.GIGANTTI_COOKIE);
      
      return {
        baseUrl: process.env.GIGANTTI_URL || 'https://www.gigantti.fi',
        cartAddEndpoint: process.env.GIGANTTI_API_CART_ADD || '/api/cart/add',
        cookie: giganttCookie,
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          'Origin': process.env.GIGANTTI_URL || 'https://www.gigantti.fi',
          'Referer': (process.env.GIGANTTI_URL || 'https://www.gigantti.fi') + '/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Cookie': giganttCookie,
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
        
        // Updated payload format for Motonet
        let requestData;
        if (currentPlatform === PLATFORMS.MOTONET) {
          // Use the correct payload format for Motonet
          requestData = {
            currency: "EUR",
            value: 119, // This could be dynamically calculated based on product price
            items: [
              {
                item_id: productId,
                product_id: "542c6ba2-db43-46b6-89d8-a9af5f10dd6f" // This could be dynamically generated or retrieved
              }
            ],
            coupons: []
          };
        } else {
          // Use the original payload format for other platforms
          requestData = { productId, quantity };
        }
        
        const response = await axios({
          method: 'post',
          url: targetUrl,
          headers: config.headers,
          data: requestData,
          timeout: 10000
        });
        
        logger.info(`Response status: ${response.status}`);
        
        // Log successful operation
        errorMonitoring.logSuccess(currentPlatform, 'add-to-cart', Date.now(), {
          productId,
          quantity,
          responseStatus: response.status
        });
        
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
    
    // Log the error with the error monitoring system
    errorMonitoring.logError(
      lastError, 
      currentPlatform, 
      'add-to-cart', 
      { productId, quantity }
    );
    
    logger.error(`Final error response: ${JSON.stringify(errorResponse)}`);
    return res.status(500).json(errorResponse);
    
  } catch (error) {
    // Log the unexpected error
    errorMonitoring.logError(
      error, 
      currentPlatform, 
      'add-to-cart', 
      { productId, quantity }
    );
    
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
      [PLATFORMS.RUSTA]: !!process.env.RUSTA_COOKIE,
      [PLATFORMS.SRYHMA]: !!process.env.SRYHMA_COOKIE,
      [PLATFORMS.GIGANTTI]: !!process.env.GIGANTTI_COOKIE
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
           <a href="https://e-commerce-chatbot-frontend.vercel.app" target="_blank">https://e-commerce-chatbot-frontend.vercel.app</a>.</p>
        
        <h2>Available Endpoints:</h2>
        
        <div class="endpoint">
          <h3>GET /health</h3>
          <p>Check the health status of the API and cookie configuration.</p>
        </div>
        
        <div class="endpoint">
          <h3>POST /api/switch-platform</h3>
          <p>Switch between supported e-commerce platforms.</p>
          <p>Payload: <code>{ "platform": "motonet" }</code>, <code>{ "platform": "rusta" }</code>, <code>{ "platform": "sryhma" }</code>, or <code>{ "platform": "gigantti" }</code></p>
        </div>
        
        <div class="endpoint">
          <h3>POST /api/add-to-cart</h3>
          <p>Add a product to the shopping cart.</p>
          <p>Payload: <code>{ "productId": "59-5064", "quantity": 1 }</code></p>
        </div>

        <div class="endpoint">
          <h3>Dashboard API</h3>
          <p>Access the dashboard at <a href="/dashboard" target="_blank">/dashboard</a></p>
          <p>The dashboard provides monitoring, configuration, and analytics for the e-commerce chatbot system.</p>
        </div>
      </body>
    </html>
  `);
});

// Add error handling middleware
app.use(errorMonitoring.createErrorMiddleware());

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Proxy server running on port ${PORT}`);
  logger.info(`Current platform: ${currentPlatform}`);
});
