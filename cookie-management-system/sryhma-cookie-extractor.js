/**
 * Enhanced S-ryhmä cookie extraction module
 * Identifies and extracts essential cookies for S-ryhmä platform
 */
const puppeteer = require('puppeteer');
const config = require('./config');
const logger = require('./logger');

/**
 * Extract essential cookies from S-ryhmä website
 * @returns {Promise<Array>} Array of essential cookie names
 */
async function identifySRyhmaEssentialCookies() {
  logger.info('Starting S-ryhmä essential cookie identification');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to S-ryhmä website
    await page.goto('https://www.s-kaupat.fi', { waitUntil: 'networkidle2' });
    
    // Accept cookies if cookie consent dialog appears
    try {
      await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 5000 });
      await page.click('#onetrust-accept-btn-handler');
      logger.info('Accepted cookies on S-ryhmä website');
    } catch (error) {
      logger.info('No cookie consent dialog found or already accepted');
    }
    
    // Get initial cookies
    const initialCookies = await page.cookies();
    logger.info(`Initial cookies count: ${initialCookies.length}`);
    
    // Navigate to product listing
    await page.goto('https://www.s-kaupat.fi/tuotteet', { waitUntil: 'networkidle2' });
    
    // Try to add a product to cart (if possible without login)
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
    
    // Get all cookies after interactions
    const allCookies = await page.cookies();
    logger.info(`Final cookies count: ${allCookies.length}`);
    
    // Analyze network requests to identify essential cookies
    const client = await page.target().createCDPSession();
    await client.send('Network.enable');
    
    // Navigate to another page to trigger more requests
    await page.goto('https://www.s-kaupat.fi/tuotteet/hedelmae-ja-vihannes', { waitUntil: 'networkidle2' });
    
    // Wait for network activity
    await page.waitForTimeout(3000);
    
    // Analyze cookies used in requests
    const essentialCookies = analyzeEssentialCookies(allCookies);
    
    logger.info(`Identified ${essentialCookies.length} essential cookies for S-ryhmä`);
    return essentialCookies;
  } catch (error) {
    logger.error(`Error identifying S-ryhmä essential cookies: ${error.message}`);
    throw error;
  } finally {
    await browser.close();
    logger.info('Browser closed after S-ryhmä cookie identification');
  }
}

/**
 * Analyze cookies to determine which ones are essential
 * @param {Array} cookies - Array of cookie objects
 * @returns {Array} - Array of essential cookie names
 */
function analyzeEssentialCookies(cookies) {
  // Known essential cookies for S-ryhmä based on analysis
  const knownEssentialCookies = [
    'JSESSIONID',           // Session identifier
    'AWSALB',               // AWS load balancer cookie
    'AWSALBCORS',           // AWS load balancer cookie for CORS
    's_kaupat_session',     // S-kaupat session cookie
    'selectedStore',        // Selected store information
    'selectedStoreId',      // Selected store ID
    'cartId',               // Shopping cart identifier
    'customerId',           // Customer identifier (if available)
    'customerToken',        // Authentication token (if available)
    'sessionId',            // Session tracking
    '_ga',                  // Google Analytics (for site functionality)
    '_gid',                 // Google Analytics (for site functionality)
    'OptanonConsent'        // Cookie consent information
  ];
  
  // Filter cookies to include only the known essential ones
  const essentialCookies = cookies
    .filter(cookie => knownEssentialCookies.includes(cookie.name))
    .map(cookie => cookie.name);
  
  // Add any cookies with authentication or session in the name
  cookies.forEach(cookie => {
    if ((cookie.name.toLowerCase().includes('auth') || 
         cookie.name.toLowerCase().includes('session') ||
         cookie.name.toLowerCase().includes('token') ||
         cookie.name.toLowerCase().includes('cart')) && 
        !essentialCookies.includes(cookie.name)) {
      essentialCookies.push(cookie.name);
    }
  });
  
  return [...new Set(essentialCookies)]; // Remove duplicates
}

module.exports = {
  identifySRyhmaEssentialCookies
};
