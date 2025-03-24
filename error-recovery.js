/**
 * Comprehensive Error Recovery System
 * Implements platform-specific error handlers and retry strategies
 */
const axios = require('axios');
const winston = require('winston');
const { format } = winston;
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  defaultMeta: { service: 'error-recovery' },
  transports: [
    new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logsDir, 'combined.log') })
  ]
});

// Add console transport in development environment
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

// In-memory storage for recent errors (for dashboard display)
const recentErrors = [];
const MAX_RECENT_ERRORS = 100;

/**
 * Error Recovery System class
 * Handles platform-specific error recovery strategies
 */
class ErrorRecoverySystem {
  constructor() {
    this.retryCounters = {};
    this.maxRetries = parseInt(process.env.MAX_RETRIES || '3', 10);
    this.baseRetryDelay = parseInt(process.env.BASE_RETRY_DELAY || '1000', 10); // 1 second
    this.maxRetryDelay = parseInt(process.env.MAX_RETRY_DELAY || '60000', 10); // 1 minute
  }

  /**
   * Handle errors with appropriate recovery strategies
   * @param {Error} error - The error to handle
   * @param {string} platform - Platform identifier (e.g., 'motonet', 'sryhma', 'gigantti')
   * @param {string} operation - Operation being performed (e.g., 'searchProducts', 'addToCart')
   * @param {Function} retryCallback - Function to call for retry
   * @returns {Promise<any>} - Result of retry or throws error if recovery failed
   */
  async handleError(error, platform, operation, retryCallback) {
    // Generate a unique key for this operation
    const operationKey = `${platform}:${operation}`;
    
    // Initialize retry counter if not exists
    if (!this.retryCounters[operationKey]) {
      this.retryCounters[operationKey] = 0;
    }
    
    // Log the error
    this.logError(error, platform, operation);
    
    // Determine error type and apply appropriate recovery strategy
    const errorType = this.determineErrorType(error, platform);
    
    // Check if we've exceeded max retries
    if (this.retryCounters[operationKey] >= this.maxRetries) {
      // Reset retry counter
      this.retryCounters[operationKey] = 0;
      
      // Log max retries exceeded
      logger.error(`Max retries exceeded for ${platform}:${operation}`, {
        platform,
        operation,
        errorType,
        maxRetries: this.maxRetries
      });
      
      // Throw error with additional context
      throw new Error(`Max retries exceeded for ${platform}:${operation}: ${error.message}`);
    }
    
    // Increment retry counter
    this.retryCounters[operationKey]++;
    
    // Apply recovery strategy based on error type
    switch (errorType) {
      case 'authentication':
        return this.handleAuthenticationError(error, platform, operation, retryCallback);
        
      case 'rateLimiting':
        return this.handleRateLimitingError(error, platform, operation, retryCallback);
        
      case 'server':
        return this.handleServerError(error, platform, operation, retryCallback);
        
      case 'network':
        return this.handleNetworkError(error, platform, operation, retryCallback);
        
      default:
        return this.handleGenericError(error, platform, operation, retryCallback);
    }
  }
  
  /**
   * Determine the type of error based on error properties and platform
   * @param {Error} error - The error to analyze
   * @param {string} platform - Platform identifier
   * @returns {string} - Error type: 'authentication', 'rateLimiting', 'server', 'network', or 'unknown'
   */
  determineErrorType(error, platform) {
    // Check if it's an Axios error
    if (error.isAxiosError) {
      // Network errors
      if (!error.response) {
        return 'network';
      }
      
      // Get status code
      const status = error.response.status;
      
      // Authentication errors (401, 403)
      if (status === 401 || status === 403) {
        return 'authentication';
      }
      
      // Rate limiting errors (429, or platform-specific headers)
      if (status === 429 || this.hasRateLimitingHeaders(error.response.headers, platform)) {
        return 'rateLimiting';
      }
      
      // Server errors (5xx)
      if (status >= 500 && status < 600) {
        return 'server';
      }
    }
    
    // Check error message for common patterns
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('unauthorized') || 
        errorMessage.includes('forbidden') || 
        errorMessage.includes('permission') || 
        errorMessage.includes('login') || 
        errorMessage.includes('authentication')) {
      return 'authentication';
    }
    
    if (errorMessage.includes('rate limit') || 
        errorMessage.includes('too many requests') || 
        errorMessage.includes('throttle')) {
      return 'rateLimiting';
    }
    
    if (errorMessage.includes('server error') || 
        errorMessage.includes('internal error') || 
        errorMessage.includes('service unavailable')) {
      return 'server';
    }
    
    if (errorMessage.includes('network') || 
        errorMessage.includes('connection') || 
        errorMessage.includes('timeout') || 
        errorMessage.includes('socket')) {
      return 'network';
    }
    
    // Platform-specific error detection
    switch (platform) {
      case 'motonet':
        if (errorMessage.includes('session expired') || errorMessage.includes('istunto')) {
          return 'authentication';
        }
        break;
        
      case 'sryhma':
        if (errorMessage.includes('kirjaudu') || errorMessage.includes('sessio')) {
          return 'authentication';
        }
        break;
        
      case 'gigantti':
        if (errorMessage.includes('session') || errorMessage.includes('login required')) {
          return 'authentication';
        }
        break;
    }
    
    // Default to unknown
    return 'unknown';
  }
  
  /**
   * Check if response headers indicate rate limiting
   * @param {Object} headers - Response headers
   * @param {string} platform - Platform identifier
   * @returns {boolean} - Whether rate limiting headers are present
   */
  hasRateLimitingHeaders(headers, platform) {
    // Common rate limiting headers
    const commonHeaders = [
      'x-rate-limit-limit',
      'x-rate-limit-remaining',
      'x-rate-limit-reset',
      'retry-after'
    ];
    
    // Check common headers
    for (const header of commonHeaders) {
      if (headers[header]) {
        return true;
      }
    }
    
    // Platform-specific headers
    switch (platform) {
      case 'motonet':
        return !!headers['x-motonet-rate-limit'];
        
      case 'sryhma':
        return !!headers['x-sryhma-rate-limit'];
        
      case 'gigantti':
        return !!headers['x-gigantti-rate-limit'];
        
      default:
        return false;
    }
  }
  
  /**
   * Handle authentication errors
   * @param {Error} error - The error to handle
   * @param {string} platform - Platform identifier
   * @param {string} operation - Operation being performed
   * @param {Function} retryCallback - Function to call for retry
   * @returns {Promise<any>} - Result of retry or throws error if recovery failed
   */
  async handleAuthenticationError(error, platform, operation, retryCallback) {
    logger.info(`Handling authentication error for ${platform}:${operation}`);
    
    try {
      // Refresh cookies for the platform
      const cookieManager = require('./cookie-management-system');
      await cookieManager.refreshPlatformCookies(platform);
      
      logger.info(`Successfully refreshed cookies for ${platform}, retrying operation`);
      
      // Wait before retry
      await this.exponentialBackoff(platform, operation);
      
      // Retry the operation
      return await retryCallback();
    } catch (refreshError) {
      logger.error(`Failed to refresh cookies for ${platform}`, {
        platform,
        operation,
        error: refreshError.message
      });
      
      // Re-throw the original error with context
      throw new Error(`Authentication error for ${platform}: ${error.message}`);
    }
  }
  
  /**
   * Handle rate limiting errors
   * @param {Error} error - The error to handle
   * @param {string} platform - Platform identifier
   * @param {string} operation - Operation being performed
   * @param {Function} retryCallback - Function to call for retry
   * @returns {Promise<any>} - Result of retry or throws error if recovery failed
   */
  async handleRateLimitingError(error, platform, operation, retryCallback) {
    logger.info(`Handling rate limiting error for ${platform}:${operation}`);
    
    // Get retry delay from headers if available
    let retryDelay = null;
    
    if (error.isAxiosError && error.response && error.response.headers) {
      const headers = error.response.headers;
      
      // Check for Retry-After header (in seconds)
      if (headers['retry-after']) {
        retryDelay = parseInt(headers['retry-after'], 10) * 1000;
      }
      
      // Platform-specific retry headers
      switch (platform) {
        case 'motonet':
          if (headers['x-motonet-retry-after']) {
            retryDelay = parseInt(headers['x-motonet-retry-after'], 10) * 1000;
          }
          break;
          
        case 'sryhma':
          if (headers['x-sryhma-retry-after']) {
            retryDelay = parseInt(headers['x-sryhma-retry-after'], 10) * 1000;
          }
          break;
          
        case 'gigantti':
          if (headers['x-gigantti-retry-after']) {
            retryDelay = parseInt(headers['x-gigantti-retry-after'], 10) * 1000;
          }
          break;
      }
    }
    
    // If no retry delay from headers, use exponential backoff
    if (!retryDelay) {
      retryDelay = this.calculateExponentialBackoff(platform, operation);
    }
    
    logger.info(`Rate limiting for ${platform}:${operation}, waiting ${retryDelay}ms before retry`);
    
    // Wait for the specified delay
    await new Promise(resolve => setTimeout(resolve, retryDelay));
    
    // Retry the operation
    return await retryCallback();
  }
  
  /**
   * Handle server errors
   * @param {Error} error - The error to handle
   * @param {string} platform - Platform identifier
   * @param {string} operation - Operation being performed
   * @param {Function} retryCallback - Function to call for retry
   * @returns {Promise<any>} - Result of retry or throws error if recovery failed
   */
  async handleServerError(error, platform, operation, retryCallback) {
    logger.info(`Handling server error for ${platform}:${operation}`);
    
    // Use exponential backoff before retry
    await this.exponentialBackoff(platform, operation);
    
    // Retry the operation
    return await retryCallback();
  }
  
  /**
   * Handle network errors
   * @param {Error} error - The error to handle
   * @param {string} platform - Platform identifier
   * @param {string} operation - Operation being performed
   * @param {Function} retryCallback - Function to call for retry
   * @returns {Promise<any>} - Result of retry or throws error if recovery failed
   */
  async handleNetworkError(error, platform, operation, retryCallback) {
    logger.info(`Handling network error for ${platform}:${operation}`);
    
    // Use exponential backoff before retry
    await this.exponentialBackoff(platform, operation);
    
    // Retry the operation
    return await retryCallback();
  }
  
  /**
   * Handle generic errors
   * @param {Error} error - The error to handle
   * @param {string} platform - Platform identifier
   * @param {string} operation - Operation being performed
   * @param {Function} retryCallback - Function to call for retry
   * @returns {Promise<any>} - Result of retry or throws error if recovery failed
   */
  async handleGenericError(error, platform, operation, retryCallback) {
    logger.info(`Handling generic error for ${platform}:${operation}`);
    
    // Use exponential backoff before retry
    await this.exponentialBackoff(platform, operation);
    
    // Retry the operation
    return await retryCallback();
  }
  
  /**
   * Apply exponential backoff delay
   * @param {string} platform - Platform identifier
   * @param {string} operation - Operation being performed
   * @returns {Promise<void>}
   */
  async exponentialBackoff(platform, operation) {
    const delay = this.calculateExponentialBackoff(platform, operation);
    
    logger.info(`Applying exponential backoff for ${platform}:${operation}, waiting ${delay}ms`);
    
    // Wait for the calculated delay
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  /**
   * Calculate exponential backoff delay
   * @param {string} platform - Platform identifier
   * @param {string} operation - Operation being performed
   * @returns {number} - Delay in milliseconds
   */
  calculateExponentialBackoff(platform, operation) {
    const operationKey = `${platform}:${operation}`;
    const retryCount = this.retryCounters[operationKey] || 1;
    
    // Calculate delay with exponential backoff and jitter
    const exponentialPart = Math.pow(2, retryCount - 1) * this.baseRetryDelay;
    const jitter = Math.random() * 0.3 * exponentialPart; // 0-30% jitter
    let delay = exponentialPart + jitter;
    
    // Cap at maximum delay
    delay = Math.min(delay, this.maxRetryDelay);
    
    return Math.floor(delay);
  }
  
  /**
   * Log error details
   * @param {Error} error - The error to log
   * @param {string} platform - Platform identifier
   * @param {string} operation - Operation being performed
   */
  logError(error, platform, operation) {
    // Create error object with context
    const errorObj = {
      timestamp: new Date().toISOString(),
      platform,
      operation,
      message: error.message,
      stack: error.stack,
      code: error.code || 'unknown',
      isAxiosError: !!error.isAxiosError
    };
    
    // Add response details if available (for Axios errors)
    if (error.isAxiosError && error.response) {
      errorObj.status = error.response.status;
      errorObj.statusText = error.response.statusText;
      errorObj.headers = error.response.headers;
      errorObj.data = error.response.data;
    }
    
    // Log to Winston
    logger.error(`Error in ${platform}:${operation}: ${error.message}`, errorObj);
    
    // Add to recent errors (for dashboard)
    this.addToRecentErrors(errorObj);
  }
  
  /**
   * Add error to recent errors list
   * @param {Object} errorObj - Error object with context
   */
  addToRecentErrors(errorObj) {
    // Add to beginning of array
    recentErrors.unshift(errorObj);
    
    // Trim to max length
    if (recentErrors.length > MAX_RECENT_ERRORS) {
      recentErrors.pop();
    }
  }
  
  /**
   * Get recent errors for dashboard display
   * @param {number} limit - Maximum number of errors to return
   * @returns {Array} - Array of recent errors
   */
  getRecentErrors(limit = MAX_RECENT_ERRORS) {
    return recentErrors.slice(0, limit);
  }
  
  /**
   * Reset retry counter for an operation
   * @param {string} platform - Platform identifier
   * @param {string} operation - Operation being performed
   */
  resetRetryCounter(platform, operation) {
    const operationKey = `${platform}:${operation}`;
    this.retryCounters[operationKey] = 0;
  }
  
  /**
   * Reset all retry counters
   */
  resetAllRetryCounters() {
    this.retryCounters = {};
  }
}

// Create singleton instance
const errorRecoverySystem = new ErrorRecoverySystem();

module.exports = errorRecoverySystem;
