# Cookie Management System Integration Guide

This document explains how to integrate the automated cookie management system with your e-commerce chatbot backend.

## Overview

The cookie management system provides a sustainable solution for handling cookies across multiple e-commerce platforms. It eliminates the need for manual cookie updates by automatically refreshing cookies on a schedule.

## Integration Steps

### 1. Install the Cookie Management System

```bash
# Clone the repository
git clone https://github.com/AIBennyy/e-commerce-chatbot-backend.git
cd e-commerce-chatbot-backend

# Install the cookie management system
mkdir -p cookie-management-system
cp -r /path/to/cookie-management-system/* cookie-management-system/
cd cookie-management-system
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the cookie-management-system directory:

```
# Database configuration
DB_PATH=./cookies.db

# Encryption configuration
ENCRYPTION_KEY=your-secure-encryption-key

# Scheduler configuration
REFRESH_INTERVAL=0 */12 * * *
MAX_RETRIES=3
RETRY_DELAY=60000

# Motonet configuration
MOTONET_URL=https://www.motonet.fi
MOTONET_COOKIE_MAX_AGE=86400000

# Server configuration
PORT=3001
HOST=0.0.0.0
```

### 3. Update Your Server.js File

Modify your server.js file to use the cookie management system:

```javascript
// Import the cookie management system
const cookieManager = require('./cookie-management-system');

// In your API endpoint handler
app.post('/api/add-to-cart', async (req, res) => {
  try {
    const { productId, platform = 'motonet' } = req.body;
    
    // Get fresh cookies from the cookie management system
    const cookieData = await cookieManager.getCookies(platform);
    
    if (!cookieData) {
      return res.status(500).json({ error: 'No valid cookies available' });
    }
    
    // Use the fresh cookies for your API request
    const response = await axios({
      method: 'post',
      url: 'https://www.motonet.fi/api/tracking/add-to-cart',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieData.cookieString
      },
      data: {
        currency: "EUR",
        value: 119,
        items: [
          {
            item_id: productId,
            product_id: "542c6ba2-db43-46b6-89d8-a9af5f10dd6f"
          }
        ],
        coupons: []
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### 4. Start the Cookie Management System

Add a script to your package.json:

```json
"scripts": {
  "start": "node server.js",
  "start-cookie-manager": "node cookie-management-system/index.js"
}
```

Start both services:

```bash
# Start the cookie management system
npm run start-cookie-manager

# In another terminal, start your main server
npm start
```

## API Endpoints

The cookie management system provides the following API endpoints:

- `GET /health` - Health check endpoint
- `GET /api/cookies/:platform` - Get cookies for a specific platform
- `POST /api/cookies/:platform/refresh` - Manually trigger cookie refresh
- `GET /api/status` - Get status of all platforms

## Adding New Platforms

To add support for a new e-commerce platform:

1. Update the config.js file with the new platform configuration
2. Implement platform-specific login and cookie extraction logic in cookie-extractor.js
3. Restart the cookie management system

## Troubleshooting

If you encounter issues with the cookie management system:

1. Check the logs in cookie-manager.log
2. Verify that Puppeteer can access the e-commerce websites
3. Ensure your environment variables are correctly set
4. Try manually triggering a cookie refresh using the API endpoint
