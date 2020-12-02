const fs = require('fs');
const puppeteer = require("puppeteer");

function extractItems() {
  const links = document.querySelectorAll('.title-list-grid__item--link');
  let urls = [];
  for (let link of links) {
    urls.push(link.getAttribute('href'));
  }
  return urls;
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
      }, 1000);
    });
  });
}

(async () => {
  const browser = await puppeteer.launch();
  
  const page = await browser.newPage();
  await page.setViewport({
    width: 1200,
    height: 5000,
  });

  const contentTypes = ['movie'];
  const genres = ['act', 'ani', 'cmy', 'crm', 'doc', 'drm', 'eur', 'fml', 'fnt', 'hrr', 'hst', 'msc', 'rly', 'rma', 'scf', 'spt', 'trl', 'war', 'wsn'];
  const date = new Date();
  const thisYear = date.getFullYear();

  let titles = [];
  for (let year = 1936; year <= thisYear; year++) {
    for (let contentType of contentTypes) {
      for (let genre of genres) {
        await page.goto(
          `https://www.justwatch.com/jp/動画配信サービス/netflix?content_type=${contentType}&genres=${genre}&release_year_from=${year}&release_year_until=${year}`
        );

        await autoScroll(page);
        console.log(year);
        items = await page.evaluate(extractItems);
        console.log(items);
        titles.push(items);
      }
    }
  }

  fs.writeFileSync('./titles.txt', titles.join('\n') + '\n');
    
  await browser.close();
})();
