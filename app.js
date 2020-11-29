const puppeteer = require('puppeteer');

function extractItems() {
  const links = document.querySelectorAll('.title-list-grid__item--link');
  console.log(links);
  let urls = [];
  for(let link of links) {
      urls.push(link.getAttribute('href'));
  }
  return urls;
}

async function scrollToEnd(
  page,
  scrollDelay = 1000,
) {
  try {
    let previousHeight;
  for (let i = 0; i < 10; i++) {
      previousHeight = await page.evaluate('document.body.scrollHeight');
      await page.evaluate('window.scrollTo(0, 0)');
      await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
      await page.waitForNavigation({
        waitUntil: 'networkidle0'
      });
      await page.waitForNavigation(scrollDelay);
    }
  } catch(e) { }
}

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 926 });

  await page.goto('https://www.justwatch.com/jp/%E5%8B%95%E7%94%BB%E9%85%8D%E4%BF%A1%E3%82%B5%E3%83%BC%E3%83%93%E3%82%B9/netflix', {
    waitUntil: 'networkidle0'
  });

  // Scroll to show all the items.
  // await scrollToEnd(page);
  const delay = d=>new Promise(r=>setTimeout(r,d))

  const scrollAndRemove = async () => {
      // scroll to top to trigger the scroll events
      window.scrollTo(0, 0);
      const selector = `.title-list-grid__item--link`;
      const element = document.querySelector(selector);

      // stop if there are no elements left
      if(element){
        element.scrollIntoView();

        // do my action
        // wait for a moment to reduce load or lazy loading image
        await delay(1000);
        console.log(element.innerText);
        // end of my action

        // remove the element to trigger some scroll event somewhere
        element.remove();

        // return another promise
        return scrollAndRemove()
      }
  }

  scrollAndRemove();
  items = await page.evaluate(extractItems);

  // const items = await page.evaluate(extractItems);

  // Save extracted items to a file.
  console.log(items);

  // Close the browser.
  await browser.close();
})();