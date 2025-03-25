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

// Import the cart API routes
const cartRoutes = require('./routes/cart');

// Add the dashboard API routes
app.use('/api/dashboard', dashboardApi.router);

// Add the cart API routes
app.use('/api/cart', cartRoutes);

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
        
        // Log the error
        logger.error(`Error adding to cart (attempt ${4-retries}/3): ${error.message}`);
        
        // Decrease retry count
        retries--;
        
        if (retries > 0) {
          // Wait with exponential backoff before retrying
          const backoffTime = Math.pow(2, 3 - retries) * 1000;
          logger.info(`Retrying in ${backoffTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }
    }
    
    // All retries failed
    logger.error(`All retries failed for add-to-cart operation`);
    
    // Log the error for monitoring
    errorMonitoring.logError(lastError, currentPlatform, 'add-to-cart', {
      productId,
      quantity,
      attempts: 3
    });
    
    return res.status(500).json({
      error: 'Failed to add item to cart after multiple attempts',
      details: lastError.message,
      platform: currentPlatform
    });
  } catch (error) {
    logger.error(`Unexpected error in add-to-cart: ${error.message}`);
    
    // Log the error for monitoring
    errorMonitoring.logError(error, currentPlatform, 'add-to-cart', {
      productId,
      quantity
    });
    
    return res.status(500).json({
      error: 'An unexpected error occurred',
      details: error.message,
      platform: currentPlatform
    });
  }
});

/**
 * Health check endpoint for monitoring
 */
app.get('/health', (req, res) => {
  // Check if required environment variables are set
  const requiredEnvVars = ['ENCRYPTION_KEY'];
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  // Check if at least one platform has cookies configured
  const hasCookies = Object.values(PLATFORMS).some(platform => {
    const cookieVarName = `${platform.toUpperCase()}_COOKIE`;
    return !!process.env[cookieVarName];
  });
  
  const status = missingEnvVars.length === 0 && hasCookies ? 'ok' : 'degraded';
  
  res.json({ 
    status,
    version: require('./package.json').version,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    currentPlatform,
    cookieStatus: {
      [PLATFORMS.MOTONET]: !!process.env.MOTONET_COOKIE,
      [PLATFORMS.RUSTA]: !!process.env.RUSTA_COOKIE,
      [PLATFORMS.SRYHMA]: !!process.env.SRYHMA_COOKIE,
      [PLATFORMS.GIGANTTI]: !!process.env.GIGANTTI_COOKIE
    },
    missingEnvVars: missingEnvVars.length > 0 ? missingEnvVars : null,
    uptime: process.uptime()
  });
});

/**
 * API documentation endpoint
 */
app.get('/api', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>E-Commerce Chatbot API Documentation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
          h1 { color: #333; }
          h2 { color: #444; margin-top: 30px; }
          h3 { color: #555; }
          pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
          code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
          .endpoint { margin-bottom: 30px; }
        </style>
      </head>
      <body>
        <h1>E-Commerce Chatbot API Documentation</h1>
        <p>This API provides endpoints for interacting with various e-commerce platforms.</p>
        
        <h2>Endpoints</h2>
        
        <div class="endpoint">
          <h3>GET /health</h3>
          <p>Check the health status of the API and cookie configuration.</p>
          <p><strong>Response:</strong></p>
          <pre>
{
  "status": "ok",
  "currentPlatform": "motonet",
  "cookieStatus": {
    "motonet": true,
    "rusta": false,
    "sryhma": true,
    "gigantti": true
  }
}
          </pre>
        </div>
        
        <div class="endpoint">
          <h3>POST /api/switch-platform</h3>
          <p>Switch the current e-commerce platform.</p>
          <p><strong>Request Body:</strong></p>
          <pre>
{
  "platform": "motonet" // One of: motonet, rusta, sryhma, gigantti
}
          </pre>
          <p><strong>Response:</strong></p>
          <pre>
{
  "success": true,
  "currentPlatform": "motonet"
}
          </pre>
        </div>
        
        <div class="endpoint">
          <h3>POST /api/add-to-cart</h3>
          <p>Add an item to the cart on the current platform.</p>
          <p><strong>Request Body:</strong></p>
          <pre>
{
  "productId": "123456",
  "quantity": 1
}
          </pre>
          <p><strong>Response:</strong></p>
          <pre>
{
  "success": true,
  "platform": "motonet",
  "response": { ... } // Platform-specific response
}
          </pre>
        </div>
        
        <div class="endpoint">
          <h3>GET /api/dashboard/status</h3>
          <p>Get the current status of all platforms.</p>
          <p><strong>Response:</strong></p>
          <pre>
{
  "platforms": {
    "motonet": {
      "status": "connected",
      "cookieExpiration": "2023-11-01T12:00:00Z"
    },
    "sryhma": {
      "status": "connected",
      "cookieExpiration": "2023-11-01T12:00:00Z"
    },
    "gigantti": {
      "status": "disconnected",
      "cookieExpiration": null
    }
  }
}
          </pre>
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
});
