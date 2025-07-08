import puppeteer from 'puppeteer';
import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import cliProgress from 'cli-progress';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, 'output');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'netflix_titles.csv');

const contentTypes = ['show'];
const genres = [
  'act', 'ani', 'cmy', 'crm', 'doc', 'drm', 'eur', 'fml', 'fnt',
  'hst', 'msc', 'rly', 'rma', 'scf', 'spt', 'trl', 'war', 'wsn',
];
const currentYear = new Date().getFullYear();

async function cleanOutput() {
  await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
}

async function scrapeNetflixTitles() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const seen = new Set();
  const results = [];

  const totalSteps = contentTypes.length * genres.length * 4; // 4 years
  const bar = new cliProgress.SingleBar({
    format: 'Scraping |{bar}| {percentage}% | {value}/{total} | {genre} {year}',
    hideCursor: true,
    barCompleteChar: '█',
    barIncompleteChar: '░',
  }, cliProgress.Presets.shades_classic);

  bar.start(totalSteps, 0, { genre: '', year: '' });

  for (let year = currentYear - 3; year <= currentYear; year++) {
    for (let contentType of contentTypes) {
      for (let genre of genres) {
        const url = `https://www.justwatch.com/us/provider/netflix?sort_by=trending_7_day&content_type=${contentType}&genres=${genre}&release_year_from=${year}&release_year_until=${year}`;
        bar.increment({ genre, year });

        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

          const titles = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.title-list-grid__item .title-poster__title'))
              .map(el => el.textContent.trim())
              .filter(Boolean);
          });

          for (let title of titles) {
            const key = `${title}-${genre}-${year}`;
            if (!seen.has(key)) {
              seen.add(key);
              results.push({ title, genre, year, contentType });
            }
          }
        } catch (err) {
          console.error(`⚠️ Error scraping ${url}: ${err.message}`);
        }
      }
    }
  }

  bar.stop();
  await browser.close();
  return results;
}

async function writeToCSV(data) {
  const csvWriter = createObjectCsvWriter({
    path: OUTPUT_FILE,
    header: [
      { id: 'title', title: 'Title' },
      { id: 'genre', title: 'Genre' },
      { id: 'year', title: 'Year' },
      { id: 'contentType', title: 'Type' },
    ],
  });

  await csvWriter.writeRecords(data);
  console.log(`✅ Wrote ${data.length} unique titles to ${OUTPUT_FILE}`);
}

async function main() {
  await cleanOutput();
  const titles = await scrapeNetflixTitles();
  await writeToCSV(titles);
}

main().catch(err => console.error('🔥 Unexpected error:', err));
