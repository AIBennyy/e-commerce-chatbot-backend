const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_BIN || '/app/.apt/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.goto('https://example.com');
  
  // Add your scraping or PDF generation code here
  
  await browser.close();
})();
