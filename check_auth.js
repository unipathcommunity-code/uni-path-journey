const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('https://www.unipath.me/auth', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 5000));
  
  const content = await page.content();
  if (content.includes('Tizimga kirish') || content.includes('Email') || content.includes('password')) {
    console.log("Auth page rendered successfully!");
  } else {
    console.log("Auth page failed to render. Root HTML:");
    console.log(await page.evaluate(() => document.getElementById('root')?.innerHTML));
  }
  
  await browser.close();
})();
