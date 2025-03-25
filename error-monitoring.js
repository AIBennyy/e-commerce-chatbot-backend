/**
 * Enhanced Error Logging and Monitoring System
 * Provides centralized error handling, logging, and monitoring capabilities
 * Modified for Heroku compatibility
 */

const winston = require('winston');
const { format } = winston;
const path = require('path');
const fs = require('fs');

// Define log formats
const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp(),
  format.printf(({ level, message, timestamp, ...metadata }) => {
    let metaStr = '';
    if (Object.keys(metadata).length > 0) {
      metaStr = JSON.stringify(metadata);
    }
    return `${timestamp} ${level}: ${message} ${metaStr}`;
  })
);

const fileFormat = format.combine(
  format.timestamp(),
  format.json()
);

// Create the logger with Heroku-compatible configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'e-commerce-chatbot' },
  transports: [
    // Console transport - primary for Heroku
    new winston.transports.Console({
      format: consoleFormat
    })
  ]
});

// Only create file transports in development environment, not on Heroku
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'staging') {
  // Create logs directory if it doesn't exist
  const logsDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  // Add file transports for local development
  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));
  
  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));
  
  // Add exception and rejection handlers for local development
  logger.exceptions.handle(
    new winston.transports.File({ 
      filename: path.join(logsDir, 'exceptions.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
  
  logger.rejections.handle(
    new winston.transports.File({ 
      filename: path.join(logsDir, 'rejections.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
} else {
  // For production/staging, add exception and rejection handlers to console
  logger.exceptions.handle(
    new winston.transports.Console({
      format: consoleFormat
    })
  );
  
  logger.rejections.handle(
    new winston.transports.Console({
      format: consoleFormat
    })
  );
}

// In-memory storage for recent errors (for dashboard display)
const recentErrors = [];
const MAX_RECENT_ERRORS = 100;

/**
 * Log an error with context information
 * @param {Error} error - The error object
 * @param {string} platform - The platform where the error occurred
 * @param {string} operation - The operation being performed
 * @param {Object} context - Additional context information
 */
function logError(error, platform, operation, context = {}) {
  const errorInfo = {
    timestamp: new Date(),
    message: error.message,
    stack: error.stack,
    platform,
    operation,
    ...context
  };
  
  // Log to Winston
  logger.error(error.message, errorInfo);
  
  // Store in recent errors for dashboard
  recentErrors.unshift(errorInfo);
  if (recentErrors.length > MAX_RECENT_ERRORS) {
    recentErrors.pop();
  }
  
  // Notify dashboard API if available
  try {
    const dashboardApi = require('./dashboard-api');
    if (dashboardApi && typeof dashboardApi.logError === 'function') {
      dashboardApi.logError(platform, operation, error.message);
    }
  } catch (e) {
    // Dashboard API not available, ignore
  }
}

/**
 * Log a successful operation
 * @param {string} platform - The platform where the operation occurred
 * @param {string} operation - The operation being performed
 * @param {number} responseTime - Response time in milliseconds
 * @param {Object} context - Additional context information
 */
function logSuccess(platform, operation, responseTime, context = {}) {
  const successInfo = {
    timestamp: new Date(),
    platform,
    operation,
    responseTime,
    ...context
  };
  
  // Log to Winston
  logger.info(`${operation} on ${platform} completed in ${responseTime}ms`, successInfo);
  
  // Notify dashboard API if available
  try {
    const dashboardApi = require('./dashboard-api');
    if (dashboardApi && typeof dashboardApi.logSuccess === 'function') {
      dashboardApi.logSuccess(platform, operation, responseTime);
    }
  } catch (e) {
    // Dashboard API not available, ignore
  }
}

/**
 * Get recent errors for monitoring
 * @param {number} limit - Maximum number of errors to return
 * @returns {Array} - Array of recent errors
 */
function getRecentErrors(limit = MAX_RECENT_ERRORS) {
  return recentErrors.slice(0, limit);
}

/**
 * Create an Express middleware for error logging
 * @returns {Function} - Express middleware function
 */
function createErrorMiddleware() {
  return (err, req, res, next) => {
    const platform = req.body?.platform || req.query?.platform || 'unknown';
    const operation = req.path;
    
    logError(err, platform, operation, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // Send error response
    res.status(err.status || 500).json({
      error: err.message,
      status: err.status || 500
    });
  };
}

/**
 * Create an Express middleware for request logging
 * @returns {Function} - Express middleware function
 */
function createRequestLoggerMiddleware() {
  return (req, res, next) => {
    const start = Date.now();
    
    // Log request
    logger.info(`${req.method} ${req.originalUrl}`, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - start;
      const platform = req.body?.platform || req.query?.platform || 'unknown';
      const operation = req.path;
      
      if (res.statusCode >= 400) {
        logError(new Error(`HTTP ${res.statusCode}`), platform, operation, {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          duration
        });
      } else {
        logSuccess(platform, operation, duration, {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode
        });
      }
    });
    
    next();
  };
}

module.exports = {
  logger,
  logError,
  logSuccess,
  getRecentErrors,
  createErrorMiddleware,
  createRequestLoggerMiddleware
};
