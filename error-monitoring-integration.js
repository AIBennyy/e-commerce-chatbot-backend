/**
 * Integration of Error Monitoring System with Server
 * Updates server.js to use the enhanced error logging and monitoring system
 */

// Import the error monitoring system
const errorMonitoring = require('./error-monitoring');

// Add request logging middleware (place after express.json() middleware)
app.use(errorMonitoring.createRequestLoggerMiddleware());

// Replace the existing logger with the enhanced one
const logger = errorMonitoring.logger;

// Add error handling middleware (place at the end of all routes)
app.use(errorMonitoring.createErrorMiddleware());

// Update error handling in platform adapters to use the new system
const { logError } = errorMonitoring;
