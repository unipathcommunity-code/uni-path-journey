const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('https://www.unipath.me', { waitUntil: 'networkidle2' });
  
  const content = await page.content();
  console.log("HTML length:", content.length);
  
  await browser.close();
})();
