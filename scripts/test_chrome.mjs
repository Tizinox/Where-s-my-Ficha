import puppeteer from 'puppeteer-core';
import fs from 'fs';

(async () => {
  try {
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: 'new'
    });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle0' });
    
    await browser.close();
  } catch (error) {
    console.error('Puppeteer Error:', error);
  }
})();
