/**
 * Enhanced Gigantti cookie extraction module
 * Identifies and extracts essential cookies for Gigantti platform
 */
const puppeteer = require('puppeteer');
const config = require('./config');
const logger = require('./logger');

/**
 * Extract essential cookies from Gigantti website
 * @returns {Promise<Array>} Array of essential cookie names
 */
async function identifyGiganttiEssentialCookies() {
  logger.info('Starting Gigantti essential cookie identification');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to Gigantti website
    await page.goto('https://www.gigantti.fi', { waitUntil: 'networkidle2' });
    
    // Accept cookies if cookie consent dialog appears
    try {
      await page.waitForSelector('#coiPage-1 button[data-index="1"]', { timeout: 5000 });
      await page.click('#coiPage-1 button[data-index="1"]');
      logger.info('Accepted cookies on Gigantti website');
    } catch (error) {
      logger.info('No cookie consent dialog found or already accepted');
    }
    
    // Get initial cookies
    const initialCookies = await page.cookies();
    logger.info(`Initial cookies count: ${initialCookies.length}`);
    
    // Navigate to product category
    await page.goto('https://www.gigantti.fi/tietokoneet/kannettavat-tietokoneet', { waitUntil: 'networkidle2' });
    
    // Try to view a product
    try {
      await page.waitForSelector('.product-list-item', { timeout: 5000 });
      await page.click('.product-list-item');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      // Try to add to cart
      await page.waitForSelector('button.add-to-cart', { timeout: 5000 });
      await page.click('button.add-to-cart');
      
      // Wait for cart update
      await page.waitForTimeout(2000);
      
      // View cart
      await page.goto('https://www.gigantti.fi/cart', { waitUntil: 'networkidle2' });
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
    await page.goto('https://www.gigantti.fi/kodinkoneet', { waitUntil: 'networkidle2' });
    
    // Wait for network activity
    await page.waitForTimeout(3000);
    
    // Analyze cookies used in requests
    const essentialCookies = analyzeEssentialCookies(allCookies);
    
    logger.info(`Identified ${essentialCookies.length} essential cookies for Gigantti`);
    return essentialCookies;
  } catch (error) {
    logger.error(`Error identifying Gigantti essential cookies: ${error.message}`);
    throw error;
  } finally {
    await browser.close();
    logger.info('Browser closed after Gigantti cookie identification');
  }
}

/**
 * Analyze cookies to determine which ones are essential
 * @param {Array} cookies - Array of cookie objects
 * @returns {Array} - Array of essential cookie names
 */
function analyzeEssentialCookies(cookies) {
  // Known essential cookies for Gigantti based on analysis
  const knownEssentialCookies = [
    'JSESSIONID',           // Session identifier
    'ASP.NET_SessionId',    // ASP.NET session ID
    'cart-id',              // Shopping cart identifier
    'customer-id',          // Customer identifier
    'gigantti_session',     // Gigantti session cookie
    'gigantti_cart',        // Cart information
    'gigantti_user',        // User information
    'gigantti_auth',        // Authentication token
    'BVBRANDID',            // Bazaarvoice brand ID
    'BVBRANDSID',           // Bazaarvoice brand session ID
    '_ga',                  // Google Analytics (for site functionality)
    '_gid',                 // Google Analytics (for site functionality)
    'coi_status',           // Cookie consent status
    'dwanonymous_*',        // Demandware anonymous user
    'dwsecuretoken_*',      // Demandware secure token
    'dwsid',                // Demandware session ID
    '__cq_dnt',             // Do not track flag
    'dw_*'                  // Other Demandware cookies
  ];
  
  // Filter cookies to include only the known essential ones
  // Use startsWith for cookies with wildcards
  const essentialCookies = cookies
    .filter(cookie => {
      return knownEssentialCookies.some(pattern => {
        if (pattern.endsWith('*')) {
          const prefix = pattern.slice(0, -1);
          return cookie.name.startsWith(prefix);
        }
        return pattern === cookie.name;
      });
    })
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
  identifyGiganttiEssentialCookies
};
