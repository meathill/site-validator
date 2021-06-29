#!/usr/bin/env node --experimental-repl-await

require('dotenv').config();
let puppeteer;
if (process.env.BROWSER) {
  puppeteer = require('puppeteer-core');
} else {
  puppeteer = require('puppeteer');
}
const axios = require('axios');
const {
  promises: {
    writeFile,
  },
} = require('fs');
const {resolve} = require('path');
const querystring = require('querystring');
const config = require('./config');
const {
  isNumber,
  isEmpty,
  reduce,
} = require('lodash');
const {crawl} = require('./lib/traverse');


const {startUrl, domains} = config;

(async () => {
  console.log('[SV] start');
  if (!startUrl) {
    throw new Error('[SV] No start URL');
  }
  const url = new URL(startUrl);
  if (domains) {
    domains.push(url.hostname);
  } else {
    config.domains = [url.hostname];
  }

  let browser;
  try {
    const options = {
      args: [
        '--no-sandbox',
        '--disabled-setupid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
      ],
    };
    if (process.env.BROWSER) {
      options.executablePath = process.env.BROWSER;
    }
    browser = await puppeteer.launch(options);
    const page = await browser.newPage();
    const {checked, langNotMatch} = await crawl(page, startUrl);

    const {total, broken} = reduce(checked, ({total, broken}, item, url) => {
      if (isNumber(item)) {
        if (item < 400) {
          total.pass += 1;
        } else {
          total.fail += 1;
          broken[url] = item;
        }
      } else {
        total.error += 1;
        const {message} = item;
        broken[url] = message;
      }
      return {total, broken};
    },
      {
        total: {
          pass: 0,
          error: 0,
          fail: 0,
        },
        broken: {},
      },
    );
    console.table(total);
    if (!isEmpty(broken)) {
      console.table(broken);
    }
    if (process.env.SERVER_CHAN_KEY) {
      const key = process.env.SERVER_CHAN_KEY;
      const data = querystring.stringify({
        title: '[Site Validator] - OR',
        desp: JSON.stringify(total),
      });
      await axios.post(`https://sctapi.ftqq.com/${key}.send`, data);
      const date = new Date();
      const log = resolve(__dirname, [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
      ].join('-') + '.log');
      await writeFile(log, JSON.stringify(broken), 'utf8');
    }

    if (langNotMatch && langNotMatch.length !== 0) {
      console.log('\nLanguage not matched:');
      console.table(langNotMatch);
    }
  } catch (e) {
    console.error(e);
  }
  await browser.close();
  console.log('[SV] over');
})();
