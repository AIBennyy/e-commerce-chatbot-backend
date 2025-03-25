/**
 * Main application entry point for cookie management system
 */
const database = require('./database');
const scheduler = require('./scheduler');
const apiService = require('./api-service');
const logger = require('./logger');
const config = require('./config');

class CookieManagementSystem {
  /**
   * Initialize and start the cookie management system
   */
  async start() {
    try {
      logger.info('Starting Cookie Management System');
      
      // Initialize database
      logger.info('Initializing database');
      await database.initializeDatabase();
      
      // Start the scheduler for automatic cookie refresh
      logger.info('Starting scheduler');
      scheduler.start();
      
      // Start the API service
      logger.info('Starting API service');
      await apiService.start();
      
      logger.info('Cookie Management System started successfully');
      
      // Handle graceful shutdown
      this.setupShutdownHandlers();
      
      return true;
    } catch (error) {
      logger.error(`Failed to start Cookie Management System: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Stop the cookie management system
   */
  async stop() {
    logger.info('Stopping Cookie Management System');
    
    try {
      // Stop the API service
      logger.info('Stopping API service');
      await apiService.stop();
      
      // Stop the scheduler
      logger.info('Stopping scheduler');
      scheduler.stop();
      
      // Close database connections
      logger.info('Closing database connections');
      database.close();
      
      logger.info('Cookie Management System stopped successfully');
      return true;
    } catch (error) {
      logger.error(`Error stopping Cookie Management System: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Set up handlers for graceful shutdown
   */
  setupShutdownHandlers() {
    // Handle process termination signals
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      await this.stop();
      process.exit(0);
    });
    
    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      await this.stop();
      process.exit(0);
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      logger.error(`Uncaught exception: ${error.message}`);
      logger.error(error.stack);
      await this.stop();
      process.exit(1);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      logger.error(`Unhandled promise rejection: ${reason}`);
      await this.stop();
      process.exit(1);
    });
  }
}

// Create and start the system when this file is run directly
if (require.main === module) {
  const system = new CookieManagementSystem();
  system.start().catch(error => {
    console.error(`Failed to start: ${error.message}`);
    process.exit(1);
  });
}

module.exports = new CookieManagementSystem();
