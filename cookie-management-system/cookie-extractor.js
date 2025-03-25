/**
 * Cookie Extractor module for cookie management system
 * Uses Puppeteer Core to extract cookies from e-commerce websites
 */
const puppeteer = require('puppeteer-core');
const config = require('./config');
const logger = require('./logger');

class CookieExtractor {
  /**
   * Extract cookies from a specific platform
   * @param {string} platform - Platform identifier (e.g., 'motonet')
   * @returns {Promise<string>} - Extracted cookie string
   */
  async extractCookies(platform) {
    if (!config.platforms[platform]) {
      throw new Error(`Platform ${platform} is not configured`);
    }

    const platformConfig = config.platforms[platform];
    logger.info(`Starting cookie extraction for ${platform}`);

    const browser = await puppeteer.launch({
      executablePath: process.env.CHROME_BIN || '/app/.apt/usr/bin/google-chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // Set a realistic user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36');
      
      // Navigate to the platform URL
      logger.info(`Navigating to ${platformConfig.url}`);
      await page.goto(platformConfig.url, { waitUntil: 'networkidle2' });
      
      // Handle login if required
      if (platformConfig.loginRequired) {
        await this.handleLogin(page, platform);
      }
      
      // Perform additional actions to ensure all necessary cookies are set
      await this.performAdditionalActions(page, platform);
      
      // Extract cookies
      const cookies = await page.cookies();
      logger.info(`Extracted ${cookies.length} cookies from ${platform}`);
      
      // Filter essential cookies if specified
      const filteredCookies = this.filterEssentialCookies(cookies, platformConfig.essentialCookies);
      
      // Format cookies as string
      const cookieString = this.formatCookieString(filteredCookies);
      
      return cookieString;
    } catch (error) {
      logger.error(`Error extracting cookies for ${platform}: ${error.message}`);
      throw error;
    } finally {
      await browser.close();
      logger.info(`Browser closed for ${platform}`);
    }
  }
  
  /**
   * Handle login process for platforms that require authentication
   * @param {Page} page - Puppeteer page object
   * @param {string} platform - Platform identifier
   */
  async handleLogin(page, platform) {
    const platformConfig = config.platforms[platform];
    
    if (!platformConfig.username || !platformConfig.password) {
      throw new Error(`Login credentials not provided for ${platform}`);
    }
    
    logger.info(`Handling login for ${platform}`);
    
    // Platform-specific login logic
    switch (platform) {
      case 'smarket':
        // Example login implementation for S-market
        await page.waitForSelector('#username');
        await page.type('#username', platformConfig.username);
        await page.type('#password', platformConfig.password);
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        break;
        
      case 'gigantti':
        // Example login implementation for Gigantti
        await page.waitForSelector('.login-form');
        await page.type('input[name="email"]', platformConfig.username);
        await page.type('input[name="password"]', platformConfig.password);
        await page.click('.login-button');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        break;
        
      default:
        logger.warn(`No specific login handler for ${platform}, using generic approach`);
        // Generic login approach
        await page.waitForSelector('input[type="email"], input[name="email"], input[type="username"]');
        await page.type('input[type="email"], input[name="email"], input[type="username"]', platformConfig.username);
        await page.type('input[type="password"], input[name="password"]', platformConfig.password);
        await page.click('button[type="submit"], input[type="submit"], .login-button');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
    }
    
    logger.info(`Login completed for ${platform}`);
  }
  
  /**
   * Perform additional actions to ensure all necessary cookies are set
   * @param {Page} page - Puppeteer page object
   * @param {string} platform - Platform identifier
   */
  async performAdditionalActions(page, platform) {
    logger.info(`Performing additional actions for ${platform}`);
    
    // Platform-specific actions
    switch (platform) {
      case 'motonet':
        // Visit a product page and add to cart to ensure cart cookies are set
        await page.goto('https://www.motonet.fi/fi/tuote/79-0007/Moottorioljy-5W-30-4-l-Mobil-Super-3000-XE', { waitUntil: 'networkidle2' });
        // Wait for a moment to ensure cookies are set
        await page.waitForTimeout(2000);
        break;
        
      case 'smarket':
        // Example: Navigate to grocery section
        await page.goto('https://www.s-kaupat.fi/tuotteet/ruoka', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);
        break;
        
      case 'gigantti':
        // Example: Navigate to electronics section
        await page.goto('https://www.gigantti.fi/tietokoneet', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);
        break;
        
      default:
        // Generic approach: just wait a bit longer on the main page
        await page.waitForTimeout(3000);
    }
    
    logger.info(`Additional actions completed for ${platform}`);
  }
  
  /**
   * Filter cookies to only include essential ones if specified
   * @param {Array} cookies - Array of cookie objects
   * @param {Array} essentialCookies - Array of essential cookie names
   * @returns {Array} - Filtered array of cookie objects
   */
  filterEssentialCookies(cookies, essentialCookies) {
    if (!essentialCookies || essentialCookies.length === 0) {
      return cookies; // Return all cookies if no essential cookies specified
    }
    
    return cookies.filter(cookie => essentialCookies.includes(cookie.name));
  }
  
  /**
   * Format cookies array into a cookie string
   * @param {Array} cookies - Array of cookie objects
   * @returns {string} - Formatted cookie string
   */
  formatCookieString(cookies) {
    return cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
  }
}

module.exports = new CookieExtractor();
