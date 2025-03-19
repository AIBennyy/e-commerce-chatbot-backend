# E-Commerce Platform Adapter Architecture

This document outlines the modular architecture for supporting multiple e-commerce platforms in the chatbot system.

## Overview

The architecture follows an adapter pattern to provide a consistent interface for interacting with different e-commerce platforms. This allows the core chatbot functionality to remain platform-agnostic while platform-specific implementations handle the details of each e-commerce site.

## Core Components

### 1. Platform Adapter Interface

All platform adapters implement a common interface with these methods:

- `searchProducts(query, options)` - Search for products
- `getProductDetails(productId)` - Get detailed information about a product
- `addToCart(productId, quantity)` - Add a product to the cart
- `getCartContents()` - Get the current contents of the cart
- `checkout(options)` - Initiate the checkout process

### 2. Cookie Management Integration

Each adapter uses the cookie management system to handle authentication:

- Automatically refreshes cookies before they expire
- Securely stores cookies for each platform
- Provides fresh cookies for API requests

### 3. Platform-Specific Implementations

Each platform has its own adapter implementation that handles:

- API endpoints specific to that platform
- Request/response formats
- Error handling and retry logic
- Platform-specific features

## Adapter Implementation

### Base Adapter Class

```javascript
class BaseECommerceAdapter {
  constructor(cookieManager) {
    this.cookieManager = cookieManager;
    this.platformId = 'base'; // Override in subclasses
  }

  async getCookies() {
    return this.cookieManager.getCookies(this.platformId);
  }

  async searchProducts(query, options = {}) {
    throw new Error('Method not implemented');
  }

  async getProductDetails(productId) {
    throw new Error('Method not implemented');
  }

  async addToCart(productId, quantity = 1) {
    throw new Error('Method not implemented');
  }

  async getCartContents() {
    throw new Error('Method not implemented');
  }

  async checkout(options = {}) {
    throw new Error('Method not implemented');
  }
}
```

### Platform-Specific Adapters

Each platform extends the base adapter:

```javascript
class MotonetAdapter extends BaseECommerceAdapter {
  constructor(cookieManager) {
    super(cookieManager);
    this.platformId = 'motonet';
    this.baseUrl = 'https://www.motonet.fi';
  }

  async searchProducts(query, options = {}) {
    // Motonet-specific implementation
  }

  async getProductDetails(productId) {
    // Motonet-specific implementation
  }

  async addToCart(productId, quantity = 1) {
    // Motonet-specific implementation using the correct API endpoint and payload format
  }

  // Other method implementations...
}
```

## Factory Pattern for Adapter Creation

```javascript
class ECommerceAdapterFactory {
  constructor(cookieManager) {
    this.cookieManager = cookieManager;
    this.adapters = {};
  }

  getAdapter(platform) {
    if (!this.adapters[platform]) {
      switch (platform) {
        case 'motonet':
          this.adapters[platform] = new MotonetAdapter(this.cookieManager);
          break;
        case 'smarket':
          this.adapters[platform] = new SMarketAdapter(this.cookieManager);
          break;
        case 'gigantti':
          this.adapters[platform] = new GiganttiAdapter(this.cookieManager);
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    }
    return this.adapters[platform];
  }
}
```

## Integration with Chatbot Backend

```javascript
// In server.js
const cookieManager = require('./cookie-management-system');
const { ECommerceAdapterFactory } = require('./platform-adapters');

const adapterFactory = new ECommerceAdapterFactory(cookieManager);

app.post('/api/add-to-cart', async (req, res) => {
  try {
    const { productId, quantity = 1, platform = 'motonet' } = req.body;
    
    // Get the appropriate adapter for the platform
    const adapter = adapterFactory.getAdapter(platform);
    
    // Use the adapter to add the product to cart
    const result = await adapter.addToCart(productId, quantity);
    
    res.json(result);
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: error.message });
  }
});
```

## Benefits of This Architecture

1. **Separation of Concerns**: Core chatbot logic is separated from platform-specific implementations
2. **Extensibility**: New platforms can be added by creating new adapter implementations
3. **Maintainability**: Changes to one platform don't affect others
4. **Testability**: Each adapter can be tested independently
5. **Flexibility**: The system can easily switch between platforms based on user preference

## Next Steps for Implementation

1. Create the base adapter interface
2. Implement the Motonet adapter
3. Create the adapter factory
4. Integrate with the existing chatbot backend
5. Add adapters for additional platforms (S-ryhmä, Gigantti)
