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

// Import the cookie management system
const cookieManager = require('./cookie-management-system');

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

// Set default platform
let currentPlatform = PLATFORMS.MOTONET;

// Import platform adapters
const MotonetAdapter = require('./platform-adapters/src/adapters/motonet-adapter');
const BaseAdapter = require('./platform-adapters/src/base-adapter');

// Initialize platform adapters with cookie manager
const platformAdapters = {
  [PLATFORMS.MOTONET]: new MotonetAdapter(cookieManager)
};

// Import API routes
const cartRoutes = require('./routes/cart');

// Register API routes
app.use('/api/cart', cartRoutes);

// Switch platform endpoint
app.post('/api/switch-platform', (req, res) => {
  const { platform } = req.body;
  
  if (!platform || !Object.values(PLATFORMS).includes(platform)) {
    return res.status(400).json({
      error: 'Invalid platform',
      validPlatforms: Object.values(PLATFORMS)
    });
  }
  
  currentPlatform = platform;
  
  return res.json({
    success: true,
    currentPlatform
  });
});

// Add to cart endpoint
app.post('/api/add-to-cart', async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  
  if (!productId) {
    return res.status(400).json({
      error: 'Product ID is required'
    });
  }
  
  try {
    logger.info(`Adding product ${productId} (qty: ${quantity}) to cart on ${currentPlatform}`);
    
    // Get the appropriate adapter for the current platform
    const adapter = platformAdapters[currentPlatform];
    
    if (!adapter) {
      return res.status(400).json({
        error: `Platform ${currentPlatform} is not supported`
      });
    }
    
    // Try to add the product to cart with multiple retries
    let lastError = null;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Sending request to https://www.motonet.fi/api/tracking/add-to-cart (attempt ${attempt}/${maxRetries})`);
        
        // Call the adapter's addToCart method
        const response = await adapter.addToCart(productId, quantity);
        
        logger.info(`Response status: ${response?.status || 200}`);
        
        // Log the successful operation
        errorMonitoring.logOperation(currentPlatform, 'add-to-cart', {
          productId,
          quantity,
          responseStatus: response?.status || 200
        });
        
        return res.json({
          success: true,
          platform: currentPlatform,
          response
        });
      } catch (error) {
        lastError = error;
        logger.error(`Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
        
        // Wait before retrying
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
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
