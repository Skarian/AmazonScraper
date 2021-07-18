// load puppeteer
const puppeteer = require('puppeteer');
const ObjectsToCsv = require('objects-to-csv');

// Script Inputs
const domain = 'https://www.amazon.com';
const searchResultLink =
  'https://www.amazon.com/s?k=SYNTHETIC+HAIR+EXTENSIONS&page=7&qid=1626643538&ref=sr_pg_7';
const searchText = 'synthetic hair extensions';

// IIFE
(async () => {
  // wrapper to catch errors
  try {
    // create a new browser instance
    const browser = await puppeteer.launch();

    // create a page inside the browser;
    const page = await browser.newPage();

    // Promise that resolves main resource response
    const navigationPromise = page.waitForNavigation();

    // navigate to a website and set the viewport
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(searchResultLink, {
      timeout: 3000000,
    });

    await navigationPromise;

    // search and wait the product list
    // await page.type('#twotabsearchtextbox', searchText);
    // await page.waitForSelector('#nav-search-bar-form #nav-search-submit-button');
    // await page.click('#nav-search-bar-form #nav-search-submit-button');
    // await navigationPromise;

    await page.waitForSelector('.a-section > .a-text-center > .a-pagination > .a-last > a');

    // create a screenshots
    await page.screenshot({ path: 'screenshot.png' });

    const scrapeSearchPage = await page.evaluate(() => {
      // Generate array of products on page
      const links = Array.from(
        document.getElementsByClassName(
          'sg-col-4-of-12 s-result-item s-asin sg-col-4-of-16 sg-col sg-col-4-of-20'
        )
      );

      // Filter array of products to listings that have price listed
      const filteredLinks = links.filter(
        (link) =>
          link.querySelector('span.a-color-information.a-text-bold') &&
          link.querySelector('span.a-offscreen')
      );

      // Take filtered array and scrape information from each product
      const scrapedLinks = filteredLinks.map((link) => {
        return {
          name: link.querySelector('span.a-size-base-plus.a-color-base.a-text-normal').innerText,
          price: link.querySelector('span.a-offscreen').innerText,
        };
      });

      return scrapedLinks;
    });

    async function printCsv(data) {
      await new ObjectsToCsv(data).toDisk('./test.csv', { append: true });
      console.log('PAGE SCRAPED AND PRINTED TO CSV!');
    }

    printCsv(scrapeSearchPage);

    // close the browser
    await browser.close();
  } catch (error) {
    // display errors
    console.log(error);
  }
})();

// Filter array to  items with a "count", and convert strings to numbers
const processArray = (array) => {
  const filteredArray = array.filter((item) => item.count.search(/count/i) > 1);
  const mappedArray = filteredArray.map((item) => {
    const position = item.count.search(/count/i);
    if (position === 2) {
      return {
        name: item.name,
        count: parseInt(item.count.substring(0, 1), 10),
        price: parseFloat(item.price.slice(1)),
      };
    }
    if (position === 3) {
      return {
        name: item.name,
        count: parseInt(item.count.substring(0, 2), 10),
        price: parseFloat(item.price.slice(1)),
      };
    }
  });
  return mappedArray;
};

// Query Selector for "Count" property
// link.querySelector('span.a-offscreen')
