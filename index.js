const { log } = require('console');
const fs = require('fs');
const puppeteer = require("puppeteer");

function extractLinks() {
  const links = document.querySelectorAll('.title-list-grid__item--link');
  let urls = [];
  for (let link of links) {
    urls.push('https://www.justwatch.com' + link.getAttribute('href'));
  }
  return urls;
}

function extactTitleTexts() {
  const text = document.querySelector('.title-block h1').textContent;
  console.log(text);
  return text;
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      let distance = 2000;
      let timer = setInterval(() => {
        let scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 500);
    });
  });
}

(async () => {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  await page.setViewport({
    width: 1200,
    height: 5000,
  });

  const contentTypes = [
    'movie',
    'show'
  ];
  const genres = [
    'act',
    'ani',
    'cmy',
    'crm',
    'doc',
    'drm',
    'eur',
    'fml',
    'fnt',
    'hrr',
    'hst',
    'msc',
    'rly',
    'rma',
    'scf',
    'spt',
    'trl',
    'war',
    'wsn',
  ];
  const date = new Date();
  const thisYear = date.getFullYear();

  let titleLinks = [];
  for (let year = 2020; year <= 2020; year++) {
    for (let contentType of contentTypes) {
      for (let genre of genres) {
        await page.goto(
          `https://www.justwatch.com/jp/動画配信サービス/netflix?content_type=${contentType}&genres=${genre}&release_year_from=${year}&release_year_until=${year}`
        );

        await autoScroll(page);
        console.log(year);
        items = await page.evaluate(extractLinks);
        console.log(items);
        titleLinks.push(items);
      }
    }
  }

  let titles = [];
  for (let titleLink of titleLinks) {
    console.log(titleLink)
    await page.goto('https://www.justwatch.com/jp/映画/modern-times')
    await page.waitForSelector('.title-block')
    let title = await page.evaluate(extactTitleTexts);
    titles.push(title);
  }

  fs.writeFileSync('./titles.html', titles.join('\n') + '\n');

  await browser.close();
})();
