/**
 * Enhanced cookie refresh script for all platforms
 * Automatically refreshes cookies for Motonet, S-ryhmä, and Gigantti
 */
const puppeteer = require('puppeteer');
const config = require('./config');
const logger = require('./logger');
const database = require('./database');
const { updatePlatformConfigurations } = require('./platform-integration');

/**
 * Refresh cookies for all supported platforms
 * @returns {Promise<Object>} Object containing refresh results for each platform
 */
async function refreshAllPlatformCookies() {
  logger.info('Starting cookie refresh for all platforms');
  
  // First update platform configurations to ensure we have the latest essential cookies
  await updatePlatformConfigurations();
  
  const platforms = Object.keys(config.platforms);
  const results = {};
  
  for (const platform of platforms) {
    try {
      logger.info(`Refreshing cookies for ${platform}`);
      const cookies = await refreshPlatformCookies(platform);
      
      // Store cookies in database
      await database.storeCookies(platform, cookies);
      
      results[platform] = {
        success: true,
        message: `Successfully refreshed cookies for ${platform}`,
        timestamp: new Date().toISOString()
      };
      
      logger.info(`Successfully refreshed cookies for ${platform}`);
    } catch (error) {
      logger.error(`Error refreshing cookies for ${platform}: ${error.message}`);
      
      results[platform] = {
        success: false,
        message: `Error refreshing cookies for ${platform}: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  return results;
}

/**
 * Refresh cookies for a specific platform
 * @param {string} platform - Platform identifier (e.g., 'motonet', 'smarket', 'gigantti')
 * @returns {Promise<string>} - Refreshed cookie string
 */
async function refreshPlatformCookies(platform) {
  if (!config.platforms[platform]) {
    throw new Error(`Platform ${platform} is not configured`);
  }
  
  const platformConfig = config.platforms[platform];
  logger.info(`Starting cookie refresh for ${platform}`);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to platform URL
    await page.goto(platformConfig.url, { waitUntil: 'networkidle2' });
    
    // Handle cookie consent based on platform
    await handleCookieConsent(page, platform);
    
    // Handle login if required
    if (platformConfig.loginRequired && platformConfig.username && platformConfig.password) {
      await handlePlatformLogin(page, platform);
    }
    
    // Perform platform-specific actions to ensure all necessary cookies are set
    await performPlatformSpecificActions(page, platform);
    
    // Get all cookies
    const cookies = await page.cookies();
    logger.info(`Extracted ${cookies.length} cookies from ${platform}`);
    
    // Filter essential cookies if specified
    const filteredCookies = filterEssentialCookies(cookies, platformConfig.essentialCookies);
    
    // Format cookies as string
    const cookieString = formatCookieString(filteredCookies);
    
    return cookieString;
  } catch (error) {
    logger.error(`Error refreshing cookies for ${platform}: ${error.message}`);
    throw error;
  } finally {
    await browser.close();
    logger.info(`Browser closed for ${platform}`);
  }
}

/**
 * Handle cookie consent dialogs for different platforms
 * @param {Page} page - Puppeteer page object
 * @param {string} platform - Platform identifier
 */
async function handleCookieConsent(page, platform) {
  logger.info(`Handling cookie consent for ${platform}`);
  
  try {
    switch (platform) {
      case 'motonet':
        // Motonet cookie consent
        await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 5000 });
        await page.click('#onetrust-accept-btn-handler');
        break;
        
      case 'smarket':
        // S-ryhmä cookie consent
        await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 5000 });
        await page.click('#onetrust-accept-btn-handler');
        break;
        
      case 'gigantti':
        // Gigantti cookie consent
        await page.waitForSelector('#coiPage-1 button[data-index="1"]', { timeout: 5000 });
        await page.click('#coiPage-1 button[data-index="1"]');
        break;
        
      default:
        // Generic approach
        const consentSelectors = [
          '#onetrust-accept-btn-handler',
          '.cookie-consent-accept',
          '.cookie-accept-button',
          '#accept-cookies',
          'button:contains("Accept")',
          'button:contains("Accept All")',
          'button:contains("Hyväksy")',
          'button:contains("Hyväksy kaikki")'
        ];
        
        for (const selector of consentSelectors) {
          try {
            await page.waitForSelector(selector, { timeout: 2000 });
            await page.click(selector);
            logger.info(`Clicked cookie consent button with selector: ${selector}`);
            break;
          } catch (error) {
            // Continue to next selector
          }
        }
    }
    
    logger.info(`Successfully handled cookie consent for ${platform}`);
  } catch (error) {
    logger.info(`No cookie consent dialog found or already accepted for ${platform}`);
  }
  
  // Wait for any animations to complete
  await page.waitForTimeout(1000);
}

/**
 * Handle login process for platforms that require authentication
 * @param {Page} page - Puppeteer page object
 * @param {string} platform - Platform identifier
 */
async function handlePlatformLogin(page, platform) {
  const platformConfig = config.platforms[platform];
  
  if (!platformConfig.username || !platformConfig.password) {
    throw new Error(`Login credentials not provided for ${platform}`);
  }
  
  logger.info(`Handling login for ${platform}`);
  
  // Platform-specific login logic
  switch (platform) {
    case 'smarket':
      // S-ryhmä login implementation
      await page.goto('https://www.s-kaupat.fi/kirjaudu', { waitUntil: 'networkidle2' });
      await page.waitForSelector('#username');
      await page.type('#username', platformConfig.username);
      await page.type('#password', platformConfig.password);
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      break;
      
    case 'gigantti':
      // Gigantti login implementation
      await page.goto('https://www.gigantti.fi/INTERSHOP/web/WFS/store-gigantti-Site/fi_FI/-/EUR/ViewUserAccount-Start', { waitUntil: 'networkidle2' });
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
 * Perform platform-specific actions to ensure all necessary cookies are set
 * @param {Page} page - Puppeteer page object
 * @param {string} platform - Platform identifier
 */
async function performPlatformSpecificActions(page, platform) {
  logger.info(`Performing platform-specific actions for ${platform}`);
  
  // Platform-specific actions
  switch (platform) {
    case 'motonet':
      // Visit a product page and add to cart to ensure cart cookies are set
      await page.goto('https://www.motonet.fi/fi/tuote/79-0007/Moottorioljy-5W-30-4-l-Mobil-Super-3000-XE', { waitUntil: 'networkidle2' });
      // Wait for a moment to ensure cookies are set
      await page.waitForTimeout(2000);
      break;
      
    case 'smarket':
      // Navigate to grocery section
      await page.goto('https://www.s-kaupat.fi/tuotteet/ruoka', { waitUntil: 'networkidle2' });
      
      // Try to add a product to cart
      try {
        await page.waitForSelector('.product-card', { timeout: 5000 });
        await page.click('.product-card');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        
        // Try to add to cart
        await page.waitForSelector('button[data-testid="add-to-cart-button"]', { timeout: 5000 });
        await page.click('button[data-testid="add-to-cart-button"]');
        
        // Wait for cart update
        await page.waitForTimeout(2000);
      } catch (error) {
        logger.info('Could not add product to cart, continuing with session cookies only');
      }
      
      await page.waitForTimeout(2000);
      break;
      
    case 'gigantti':
      // Navigate to electronics section
      await page.goto('https://www.gigantti.fi/tietokoneet/kannettavat-tietokoneet', { waitUntil: 'networkidle2' });
      
      // Try to view a product and add to cart
      try {
        await page.waitForSelector('.product-list-item', { timeout: 5000 });
        await page.click('.product-list-item');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        
        // Try to add to cart
        await page.waitForSelector('button.add-to-cart', { timeout: 5000 });
        await page.click('button.add-to-cart');
        
        // Wait for cart update
        await page.waitForTimeout(2000);
      } catch (error) {
        logger.info('Could not add product to cart, continuing with session cookies only');
      }
      
      await page.waitForTimeout(2000);
      break;
      
    default:
      // Generic approach: just wait a bit longer on the main page
      await page.waitForTimeout(3000);
  }
  
  logger.info(`Platform-specific actions completed for ${platform}`);
}

/**
 * Filter cookies to only include essential ones if specified
 * @param {Array} cookies - Array of cookie objects
 * @param {Array} essentialCookies - Array of essential cookie names
 * @returns {Array} - Filtered array of cookie objects
 */
function filterEssentialCookies(cookies, essentialCookies) {
  if (!essentialCookies || essentialCookies.length === 0) {
    return cookies; // Return all cookies if no essential cookies specified
  }
  
  return cookies.filter(cookie => {
    // Check for exact matches
    if (essentialCookies.includes(cookie.name)) {
      return true;
    }
    
    // Check for prefix matches (for cookies like dwanonymous_*)
    for (const pattern of essentialCookies) {
      if (pattern.endsWith('_') && cookie.name.startsWith(pattern)) {
        return true;
      }
    }
    
    return false;
  });
}

/**
 * Format cookies array into a cookie string
 * @param {Array} cookies - Array of cookie objects
 * @returns {string} - Formatted cookie string
 */
function formatCookieString(cookies) {
  return cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
}

module.exports = {
  refreshAllPlatformCookies,
  refreshPlatformCookies
};
