/**
 * API Service module for cookie management system
 * Provides REST API endpoints for cookie management
 */
const express = require('express');
const database = require('./database');
const cookieExtractor = require('./cookie-extractor');
const scheduler = require('./scheduler');
const logger = require('./logger');
const config = require('./config');

class ApiService {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Set up Express middleware
   */
  setupMiddleware() {
    // Parse JSON request bodies
    this.app.use(express.json());
    
    // Basic request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`);
      next();
    });
    
    // Error handling middleware
    this.app.use((err, req, res, next) => {
      logger.error(`API Error: ${err.message}`);
      res.status(500).json({ error: err.message });
    });
  }

  /**
   * Set up API routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', version: '1.0.0' });
    });
    
    // Get cookies for a platform
    this.app.get('/api/cookies/:platform', async (req, res) => {
      try {
        const { platform } = req.params;
        
        if (!config.platforms[platform]) {
          return res.status(404).json({ error: `Platform ${platform} not found` });
        }
        
        const cookies = await database.getLatestCookies(platform);
        
        if (!cookies) {
          return res.status(404).json({ 
            error: `No valid cookies found for ${platform}`,
            message: 'Try triggering a refresh'
          });
        }
        
        res.json({
          platform,
          cookies: cookies.cookieString,
          createdAt: new Date(cookies.createdAt).toISOString(),
          expiresAt: new Date(cookies.expiresAt).toISOString()
        });
      } catch (error) {
        logger.error(`Error retrieving cookies: ${error.message}`);
        res.status(500).json({ error: error.message });
      }
    });
    
    // Refresh cookies for a platform
    this.app.post('/api/cookies/:platform/refresh', async (req, res) => {
      try {
        const { platform } = req.params;
        
        if (!config.platforms[platform]) {
          return res.status(404).json({ error: `Platform ${platform} not found` });
        }
        
        logger.info(`Manual refresh requested for ${platform}`);
        
        // Trigger cookie refresh
        await scheduler.refreshCookies(platform);
        
        // Get the newly refreshed cookies
        const cookies = await database.getLatestCookies(platform);
        
        res.json({
          platform,
          message: `Successfully refreshed cookies for ${platform}`,
          cookies: cookies.cookieString,
          createdAt: new Date(cookies.createdAt).toISOString(),
          expiresAt: new Date(cookies.expiresAt).toISOString()
        });
      } catch (error) {
        logger.error(`Error refreshing cookies: ${error.message}`);
        res.status(500).json({ error: error.message });
      }
    });
    
    // Get status of all platforms
    this.app.get('/api/status', async (req, res) => {
      try {
        const platforms = Object.keys(config.platforms);
        const statuses = {};
        
        for (const platform of platforms) {
          const cookies = await database.getLatestCookies(platform);
          
          statuses[platform] = {
            configured: true,
            hasValidCookies: !!cookies,
            cookieExpiry: cookies ? new Date(cookies.expiresAt).toISOString() : null
          };
        }
        
        res.json({
          scheduler: {
            running: scheduler.running,
            refreshInterval: config.scheduler.refreshInterval
          },
          platforms: statuses
        });
      } catch (error) {
        logger.error(`Error retrieving status: ${error.message}`);
        res.status(500).json({ error: error.message });
      }
    });
  }

  /**
   * Start the API server
   */
  start() {
    const { port, host } = config.server;
    
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(port, host, () => {
        logger.info(`API server listening on ${host}:${port}`);
        resolve();
      });
      
      this.server.on('error', (error) => {
        logger.error(`Failed to start API server: ${error.message}`);
        reject(error);
      });
    });
  }

  /**
   * Stop the API server
   */
  stop() {
    if (!this.server) {
      logger.warn('API server is not running');
      return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
      this.server.close((error) => {
        if (error) {
          logger.error(`Error stopping API server: ${error.message}`);
          reject(error);
        } else {
          logger.info('API server stopped successfully');
          this.server = null;
          resolve();
        }
      });
    });
  }
}

module.exports = new ApiService();
