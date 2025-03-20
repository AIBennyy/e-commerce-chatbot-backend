/**
 * Test suite for the E-Commerce Chatbot API
 * Implements automated tests for API endpoints and platform adapters
 */

const request = require('supertest');
const app = require('../server');
const { getCookieManager } = require('../cookie-management-system');
const { getAdapterFactory } = require('../platform-adapters');

// Mock environment variables for testing
process.env.MOTONET_COOKIE = 'test-cookie-value';
process.env.SRYHMA_COOKIE = 'test-cookie-value';
process.env.GIGANTTI_COOKIE = 'test-cookie-value';

describe('API Endpoints', () => {
  describe('GET /health', () => {
    it('should return status 200 and health information', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('currentPlatform');
      expect(response.body).toHaveProperty('cookieStatus');
    });
  });
  
  describe('POST /api/switch-platform', () => {
    it('should switch to a valid platform', async () => {
      const response = await request(app)
        .post('/api/switch-platform')
        .send({ platform: 'motonet' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('currentPlatform', 'motonet');
    });
    
    it('should return error for invalid platform', async () => {
      const response = await request(app)
        .post('/api/switch-platform')
        .send({ platform: 'invalid-platform' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid platform');
      expect(response.body).toHaveProperty('supportedPlatforms');
    });
  });
  
  describe('POST /api/add-to-cart', () => {
    // This test requires mocking the axios request
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/add-to-cart')
        .send({ productId: '' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing productId or quantity in request');
    });
  });
  
  describe('Dashboard API', () => {
    describe('GET /api/dashboard/status', () => {
      it('should return system status information', async () => {
        const response = await request(app).get('/api/dashboard/status');
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('system');
        expect(response.body).toHaveProperty('platforms');
      });
    });
    
    describe('GET /api/dashboard/cookies', () => {
      it('should return cookie health information', async () => {
        const response = await request(app).get('/api/dashboard/cookies');
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('platforms');
        expect(response.body).toHaveProperty('refreshSchedule');
      });
    });
    
    describe('GET /api/dashboard/config', () => {
      it('should return configuration information', async () => {
        const response = await request(app).get('/api/dashboard/config');
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('system');
        expect(response.body).toHaveProperty('platforms');
      });
    });
  });
});

describe('Platform Adapters', () => {
  let adapterFactory;
  let cookieManager;
  
  beforeAll(() => {
    cookieManager = getCookieManager();
    adapterFactory = getAdapterFactory();
  });
  
  describe('Motonet Adapter', () => {
    let motonetAdapter;
    
    beforeAll(() => {
      motonetAdapter = adapterFactory.getAdapter('motonet');
    });
    
    it('should be an instance of MotonetAdapter', () => {
      expect(motonetAdapter).toBeDefined();
      expect(motonetAdapter.platformId).toBe('motonet');
    });
    
    // These tests require mocking the axios requests
    it('should have required methods', () => {
      expect(typeof motonetAdapter.searchProducts).toBe('function');
      expect(typeof motonetAdapter.getProductDetails).toBe('function');
      expect(typeof motonetAdapter.addToCart).toBe('function');
      expect(typeof motonetAdapter.getCartContents).toBe('function');
      expect(typeof motonetAdapter.checkout).toBe('function');
    });
  });
  
  describe('S-ryhmä Adapter', () => {
    let sryhmaAdapter;
    
    beforeAll(() => {
      sryhmaAdapter = adapterFactory.getAdapter('sryhma');
    });
    
    it('should be an instance of SRyhmaAdapter', () => {
      expect(sryhmaAdapter).toBeDefined();
      expect(sryhmaAdapter.platformId).toBe('sryhma');
    });
    
    // These tests require mocking the axios requests
    it('should have required methods', () => {
      expect(typeof sryhmaAdapter.searchProducts).toBe('function');
      expect(typeof sryhmaAdapter.getProductDetails).toBe('function');
      expect(typeof sryhmaAdapter.addToCart).toBe('function');
      expect(typeof sryhmaAdapter.getCartContents).toBe('function');
      expect(typeof sryhmaAdapter.checkout).toBe('function');
    });
  });
  
  describe('Gigantti Adapter', () => {
    let giganttAdapter;
    
    beforeAll(() => {
      giganttAdapter = adapterFactory.getAdapter('gigantti');
    });
    
    it('should be an instance of GiganttiAdapter', () => {
      expect(giganttAdapter).toBeDefined();
      expect(giganttAdapter.platformId).toBe('gigantti');
    });
    
    // These tests require mocking the axios requests
    it('should have required methods', () => {
      expect(typeof giganttAdapter.searchProducts).toBe('function');
      expect(typeof giganttAdapter.getProductDetails).toBe('function');
      expect(typeof giganttAdapter.addToCart).toBe('function');
      expect(typeof giganttAdapter.getCartContents).toBe('function');
      expect(typeof giganttAdapter.checkout).toBe('function');
    });
  });
});

describe('Error Monitoring', () => {
  const errorMonitoring = require('../error-monitoring');
  
  it('should have required functions', () => {
    expect(typeof errorMonitoring.logError).toBe('function');
    expect(typeof errorMonitoring.logSuccess).toBe('function');
    expect(typeof errorMonitoring.getRecentErrors).toBe('function');
    expect(typeof errorMonitoring.createErrorMiddleware).toBe('function');
    expect(typeof errorMonitoring.createRequestLoggerMiddleware).toBe('function');
  });
  
  it('should log errors correctly', () => {
    const error = new Error('Test error');
    errorMonitoring.logError(error, 'test-platform', 'test-operation');
    
    const recentErrors = errorMonitoring.getRecentErrors();
    expect(recentErrors.length).toBeGreaterThan(0);
    
    const lastError = recentErrors[0];
    expect(lastError.message).toBe('Test error');
    expect(lastError.platform).toBe('test-platform');
    expect(lastError.operation).toBe('test-operation');
  });
});
