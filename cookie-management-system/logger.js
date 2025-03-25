/**
 * Logger module for cookie management system
 * Provides consistent logging across all components
 */
const winston = require('winston');
const config = require('./config');

// Create a custom format that includes timestamp and log level
const customFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level.toUpperCase()}: ${message}`;
  })
);

// Create the logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: customFormat,
  transports: [
    // Console transport for development
    new winston.transports.Console(),
    // File transport for production
    new winston.transports.File({ filename: config.logging.file })
  ]
});

module.exports = logger;
