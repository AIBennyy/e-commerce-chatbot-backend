/**
 * Dashboard API endpoints for the E-Commerce Chatbot
 * This module provides API endpoints for the dashboard to monitor and configure the system
 */

const express = require('express');
const router = express.Router();
const os = require('os');
const { getCookieManager } = require('./cookie-management-system');
const { getAdapterFactory } = require('./platform-adapters');

// In-memory storage for error logs (in production, this would use a database)
const errorLogs = [];
// In-memory storage for usage statistics (in production, this would use a database)
const usageStats = {
  operations: { total: 0, successful: 0, failed: 0 },
  platforms: {},
  timeDistribution: {
    labels: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
    data: [0, 0, 0, 0, 0, 0, 0, 0]
  }
};
// In-memory storage for performance metrics (in production, this would use a database)
const performanceMetrics = {
  overall: {
    averageResponseTime: 0,
    successRate: 0,
    errorRate: 0
  },
  responseTimes: {},
  successRates: {}
};

// Configuration defaults
const defaultConfig = {
  system: {
    defaultCookieMaxAge: 86400000, // 24 hours
    defaultRefreshInterval: '0 */12 * * *', // Every 12 hours
    cookieRefreshRetryCount: 3,
    cookieRefreshRetryDelay: 5000,
    browserTimeout: 30000,
    navigationTimeout: 30000,
    headlessBrowser: true,
    cookieEncryption: true
  },
  platforms: {
    motonet: {
      enabled: true,
      url: 'https://www.motonet.fi',
      cookieMaxAge: 86400000,
      refreshInterval: '0 */12 * * *',
      apiEndpoint: '/api/tracking/add-to-cart'
    },
    sryhma: {
      enabled: false,
      url: 'https://www.s-kaupat.fi',
      cookieMaxAge: 86400000,
      refreshInterval: '0 */12 * * *',
      apiEndpoint: '/api/cart/add'
    },
    gigantti: {
      enabled: false,
      url: 'https://www.gigantti.fi',
      cookieMaxAge: 86400000,
      refreshInterval: '0 */12 * * *',
      apiEndpoint: '/api/cart/add'
    }
  }
};

// Current configuration (would be loaded from database in production)
let currentConfig = JSON.parse(JSON.stringify(defaultConfig));

/**
 * Log an error to the error logs
 * @param {string} platform - Platform identifier
 * @param {string} operation - Operation being performed
 * @param {string} message - Error message
 * @param {boolean} resolved - Whether the error was resolved
 */
function logError(platform, operation, message, resolved = false) {
  const errorLog = {
    timestamp: new Date(),
    platform,
    operation,
    message,
    resolved
  };
  
  errorLogs.unshift(errorLog); // Add to beginning of array
  
  // Keep only the last 1000 errors
  if (errorLogs.length > 1000) {
    errorLogs.pop();
  }
  
  // Update usage statistics
  usageStats.operations.total++;
  usageStats.operations.failed++;
  
  if (!usageStats.platforms[platform]) {
    usageStats.platforms[platform] = 0;
  }
  usageStats.platforms[platform]++;
  
  // Update time distribution
  const hour = new Date().getHours();
  const timeSlot = Math.floor(hour / 3);
  usageStats.timeDistribution.data[timeSlot]++;
  
  // Update performance metrics
  if (!performanceMetrics.successRates[platform]) {
    performanceMetrics.successRates[platform] = 0;
  }
  
  // Recalculate overall metrics
  updateOverallMetrics();
}

/**
 * Log a successful operation
 * @param {string} platform - Platform identifier
 * @param {string} operation - Operation being performed
 * @param {number} responseTime - Response time in milliseconds
 */
function logSuccess(platform, operation, responseTime) {
  // Update usage statistics
  usageStats.operations.total++;
  usageStats.operations.successful++;
  
  if (!usageStats.platforms[platform]) {
    usageStats.platforms[platform] = 0;
  }
  usageStats.platforms[platform]++;
  
  // Update time distribution
  const hour = new Date().getHours();
  const timeSlot = Math.floor(hour / 3);
  usageStats.timeDistribution.data[timeSlot]++;
  
  // Update performance metrics
  if (!performanceMetrics.responseTimes[platform]) {
    performanceMetrics.responseTimes[platform] = responseTime;
  } else {
    // Calculate running average
    const count = usageStats.platforms[platform];
    performanceMetrics.responseTimes[platform] = 
      (performanceMetrics.responseTimes[platform] * (count - 1) + responseTime) / count;
  }
  
  if (!performanceMetrics.successRates[platform]) {
    performanceMetrics.successRates[platform] = 100;
  } else {
    // Calculate success rate
    const totalOps = usageStats.operations.total;
    const successfulOps = usageStats.operations.successful;
    performanceMetrics.successRates[platform] = (successfulOps / totalOps) * 100;
  }
  
  // Recalculate overall metrics
  updateOverallMetrics();
}

/**
 * Update overall performance metrics
 */
function updateOverallMetrics() {
  const totalOps = usageStats.operations.total;
  const successfulOps = usageStats.operations.successful;
  const failedOps = usageStats.operations.failed;
  
  if (totalOps > 0) {
    performanceMetrics.overall.successRate = Math.round((successfulOps / totalOps) * 100);
    performanceMetrics.overall.errorRate = Math.round((failedOps / totalOps) * 100);
  }
  
  // Calculate average response time across all platforms
  let totalResponseTime = 0;
  let platformCount = 0;
  
  for (const platform in performanceMetrics.responseTimes) {
    totalResponseTime += performanceMetrics.responseTimes[platform];
    platformCount++;
  }
  
  if (platformCount > 0) {
    performanceMetrics.overall.averageResponseTime = Math.round(totalResponseTime / platformCount);
  }
}

/**
 * Get system status endpoint
 */
router.get('/status', async (req, res) => {
  try {
    const cookieManager = getCookieManager();
    const adapterFactory = getAdapterFactory();
    
    // Get uptime in seconds
    const uptime = process.uptime();
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    
    // Get platform status
    const platforms = {};
    const supportedPlatforms = adapterFactory.getSupportedPlatforms();
    
    for (const platform of supportedPlatforms) {
      const adapter = adapterFactory.getAdapter(platform);
      const cookies = await cookieManager.getCookies(platform);
      
      let status = 'error';
      if (!adapter) {
        status = 'not_implemented';
      } else if (!cookies) {
        status = 'not_configured';
      } else {
        status = 'connected';
      }
      
      platforms[platform] = {
        status,
        lastChecked: new Date(),
        cookieExpiration: cookies ? cookies.expiresAt : null
      };
    }
    
    // Add additional platforms from config that might not be implemented yet
    for (const platform in currentConfig.platforms) {
      if (!platforms[platform]) {
        platforms[platform] = {
          status: 'not_implemented',
          lastChecked: new Date(),
          cookieExpiration: null
        };
      }
    }
    
    res.json({
      system: {
        uptime,
        memory: memoryUsage,
        lastRestart: new Date(Date.now() - (uptime * 1000))
      },
      platforms
    });
  } catch (error) {
    console.error('Error fetching system status:', error);
    res.status(500).json({ error: 'Failed to fetch system status', details: error.message });
  }
});

/**
 * Get cookie health endpoint
 */
router.get('/cookies', async (req, res) => {
  try {
    const cookieManager = getCookieManager();
    const adapterFactory = getAdapterFactory();
    const supportedPlatforms = adapterFactory.getSupportedPlatforms();
    
    const platforms = [];
    
    for (const platformId of supportedPlatforms) {
      const cookies = await cookieManager.getCookies(platformId);
      const config = currentConfig.platforms[platformId] || {};
      
      let status = 'not_configured';
      if (cookies) {
        const now = new Date();
        const expiresAt = new Date(cookies.expiresAt);
        const timeRemaining = expiresAt - now;
        
        if (timeRemaining <= 0) {
          status = 'expired';
        } else if (timeRemaining < 3600000) { // Less than 1 hour
          status = 'expiring_soon';
        } else {
          status = 'valid';
        }
      } else if (!config.enabled) {
        status = 'not_implemented';
      }
      
      platforms.push({
        id: platformId,
        name: platformId.charAt(0).toUpperCase() + platformId.slice(1),
        status,
        createdAt: cookies ? cookies.createdAt : null,
        expiresAt: cookies ? cookies.expiresAt : null
      });
    }
    
    // Add additional platforms from config that might not be implemented yet
    for (const platformId in currentConfig.platforms) {
      if (!supportedPlatforms.includes(platformId)) {
        platforms.push({
          id: platformId,
          name: platformId.charAt(0).toUpperCase() + platformId.slice(1),
          status: 'not_implemented',
          createdAt: null,
          expiresAt: null
        });
      }
    }
    
    // Get refresh schedule
    const refreshSchedule = {
      nextRun: cookieManager.getNextRefreshTime(),
      interval: currentConfig.system.defaultRefreshInterval,
      lastRun: cookieManager.getLastRefreshTime()
    };
    
    res.json({
      platforms,
      refreshSchedule
    });
  } catch (error) {
    console.error('Error fetching cookie health:', error);
    res.status(500).json({ error: 'Failed to fetch cookie health', details: error.message });
  }
});

/**
 * Refresh platform cookies endpoint
 */
router.post('/cookies/refresh', async (req, res) => {
  try {
    const { platform } = req.body;
    
    if (!platform) {
      return res.status(400).json({ error: 'Platform is required' });
    }
    
    const cookieManager = getCookieManager();
    const result = await cookieManager.refreshCookies(platform);
    
    if (result.success) {
      res.json({
        success: true,
        platform,
        message: `Cookies refreshed successfully for ${platform}`,
        expiresAt: result.expiresAt
      });
    } else {
      res.status(500).json({
        success: false,
        platform,
        error: `Failed to refresh cookies for ${platform}`,
        details: result.error
      });
    }
  } catch (error) {
    console.error('Error refreshing cookies:', error);
    res.status(500).json({ error: 'Failed to refresh cookies', details: error.message });
  }
});

/**
 * Get error logs endpoint
 */
router.get('/errors', (req, res) => {
  try {
    const { platform, status, timeRange } = req.query;
    
    // Filter error logs
    let filteredLogs = [...errorLogs];
    
    if (platform && platform !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.platform === platform);
    }
    
    if (status && status !== 'all') {
      const resolved = status === 'resolved';
      filteredLogs = filteredLogs.filter(log => log.resolved === resolved);
    }
    
    if (timeRange && timeRange !== 'all') {
      const now = new Date();
      let cutoff;
      
      switch (timeRange) {
        case '1h':
          cutoff = new Date(now.getTime() - 3600000);
          break;
        case '24h':
          cutoff = new Date(now.getTime() - 86400000);
          break;
        case '7d':
          cutoff = new Date(now.getTime() - 604800000);
          break;
        case '30d':
          cutoff = new Date(now.getTime() - 2592000000);
          break;
        default:
          cutoff = new Date(0); // Beginning of time
      }
      
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= cutoff);
    }
    
    res.json({
      errors: filteredLogs,
      total: filteredLogs.length
    });
  } catch (error) {
    console.error('Error fetching error logs:', error);
    res.status(500).json({ error: 'Failed to fetch error logs', details: error.message });
  }
});

/**
 * Get configuration endpoint
 */
router.get('/config', (req, res) => {
  try {
    res.json(currentConfig);
  } catch (error) {
    console.error('Error fetching configuration:', error);
    res.status(500).json({ error: 'Failed to fetch configuration', details: error.message });
  }
});

/**
 * Update configuration endpoint
 */
router.post('/config', (req, res) => {
  try {
    const newConfig = req.body;
    
    // Validate configuration
    if (!newConfig || typeof newConfig !== 'object') {
      return res.status(400).json({ error: 'Invalid configuration format' });
    }
    
    // Update configuration
    if (newConfig.system) {
      currentConfig.system = { ...currentConfig.system, ...newConfig.system };
    }
    
    if (newConfig.platforms) {
      for (const platform in newConfig.platforms) {
        if (!currentConfig.platforms[platform]) {
          currentConfig.platforms[platform] = {};
        }
        currentConfig.platforms[platform] = { 
          ...currentConfig.platforms[platform], 
          ...newConfig.platforms[platform] 
        };
      }
    }
    
    // In a production environment, we would save this to a database
    
    res.json({
      success: true,
      message: 'Configuration updated successfully',
      config: currentConfig
    });
  } catch (error) {
    console.error('Error updating configuration:', error);
    res.status(500).json({ error: 'Failed to update configuration', details: error.message });
  }
});

/**
 * Get usage statistics endpoint
 */
router.get('/stats', (req, res) => {
  try {
    const { timeRange } = req.query;
    
    // In a production environment, we would filter based on time range
    // For now, we'll just return all stats
    
    res.json(usageStats);
  } catch (error) {
    console.error('Error fetching usage statistics:', error);
    res.status(500).json({ error: 'Failed to fetch usage statistics', details: error.message });
  }
});

/**
 * Get performance metrics endpoint
 */
router.get('/metrics', (req, res) => {
  try {
    const { timeRange } = req.query;
    
    // In a production environment, we would filter based on time range
    // For now, we'll just return all metrics
    
    res.json(performanceMetrics);
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ error: 'Failed to fetch performance metrics', details: error.message });
  }
});

// Export the router and utility functions for use in server.js
module.exports = {
  router,
  logError,
  logSuccess
};
