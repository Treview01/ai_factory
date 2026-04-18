import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlFile = process.argv[2] || 'kimchi-fried-rice.html';
const outputFile = process.argv[3] || htmlFile.replace('.html', '.png');

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 800, height: 600 });
await page.goto(`file://${path.resolve(__dirname, htmlFile)}`, { waitUntil: 'networkidle0', timeout: 15000 });
await page.screenshot({ path: path.resolve(__dirname, outputFile), type: 'png' });
await browser.close();
console.log(`Screenshot saved: ${outputFile}`);
