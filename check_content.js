const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('https://www.unipath.me', { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  // wait 5 seconds for react to render
  await new Promise(r => setTimeout(r, 5000));
  
  const rootHTML = await page.evaluate(() => document.getElementById('root')?.innerHTML);
  console.log("ROOT HTML:");
  console.log(rootHTML);
  
  await browser.close();
})();
