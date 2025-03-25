/**
 * Scheduler module for cookie management system
 * Handles automatic cookie refresh on a schedule
 */
const cron = require('node-cron');
const database = require('./database');
const cookieExtractor = require('./cookie-extractor');
const logger = require('./logger');
const config = require('./config');

class Scheduler {
  constructor() {
    this.jobs = {};
    this.running = false;
  }

  /**
   * Start the scheduler for all configured platforms
   */
  start() {
    if (this.running) {
      logger.warn('Scheduler is already running');
      return;
    }

    logger.info('Starting cookie refresh scheduler');
    
    // Schedule cookie refresh for each configured platform
    Object.keys(config.platforms).forEach(platform => {
      this.schedulePlatform(platform);
    });
    
    // Schedule cleanup job to remove expired cookies
    this.scheduleCleanup();
    
    this.running = true;
    logger.info('Cookie refresh scheduler started successfully');
  }

  /**
   * Schedule cookie refresh for a specific platform
   * @param {string} platform - Platform identifier (e.g., 'motonet')
   */
  schedulePlatform(platform) {
    const platformConfig = config.platforms[platform];
    
    if (!platformConfig) {
      logger.error(`Cannot schedule refresh for unknown platform: ${platform}`);
      return;
    }
    
    logger.info(`Scheduling cookie refresh for ${platform} with interval: ${config.scheduler.refreshInterval}`);
    
    // Create a cron job for this platform
    this.jobs[platform] = cron.schedule(config.scheduler.refreshInterval, async () => {
      logger.info(`Running scheduled cookie refresh for ${platform}`);
      await this.refreshCookies(platform);
    });
    
    // Run an initial refresh immediately
    this.refreshCookies(platform).catch(err => {
      logger.error(`Initial cookie refresh failed for ${platform}: ${err.message}`);
    });
  }

  /**
   * Schedule cleanup job to remove expired cookies
   */
  scheduleCleanup() {
    // Run cleanup daily at midnight
    this.jobs['cleanup'] = cron.schedule('0 0 * * *', async () => {
      logger.info('Running scheduled cleanup of expired cookies');
      try {
        const deletedCount = await database.cleanupExpiredCookies();
        logger.info(`Cleanup completed, removed ${deletedCount} expired cookie entries`);
      } catch (error) {
        logger.error(`Cookie cleanup failed: ${error.message}`);
      }
    });
  }

  /**
   * Refresh cookies for a specific platform
   * @param {string} platform - Platform identifier (e.g., 'motonet')
   * @returns {Promise<boolean>} - Success status
   */
  async refreshCookies(platform) {
    const platformConfig = config.platforms[platform];
    
    if (!platformConfig) {
      throw new Error(`Cannot refresh cookies for unknown platform: ${platform}`);
    }
    
    logger.info(`Starting cookie refresh for ${platform}`);
    
    // Implement retry logic
    let retries = config.scheduler.maxRetries;
    let success = false;
    let lastError = null;
    
    while (retries > 0 && !success) {
      try {
        // Extract cookies using Puppeteer
        const cookieString = await cookieExtractor.extractCookies(platform);
        
        if (!cookieString) {
          throw new Error(`Failed to extract cookies for ${platform}: Empty cookie string`);
        }
        
        // Store cookies in database
        await database.storeCookies(
          platform, 
          cookieString, 
          platformConfig.cookieMaxAge
        );
        
        logger.info(`Successfully refreshed cookies for ${platform}`);
        success = true;
      } catch (error) {
        lastError = error;
        retries--;
        
        if (retries > 0) {
          const delay = config.scheduler.retryDelay;
          logger.warn(`Cookie refresh failed for ${platform}, retrying in ${delay}ms. Error: ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          logger.error(`All cookie refresh attempts failed for ${platform}: ${error.message}`);
        }
      }
    }
    
    if (!success && lastError) {
      throw lastError;
    }
    
    return success;
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.running) {
      logger.warn('Scheduler is not running');
      return;
    }
    
    logger.info('Stopping cookie refresh scheduler');
    
    // Stop all scheduled jobs
    Object.keys(this.jobs).forEach(jobName => {
      this.jobs[jobName].stop();
      logger.info(`Stopped job: ${jobName}`);
    });
    
    this.jobs = {};
    this.running = false;
    logger.info('Cookie refresh scheduler stopped successfully');
  }
}

module.exports = new Scheduler();
