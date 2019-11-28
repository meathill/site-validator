#!/usr/bin/env node --experimental-repl-await

const puppeteer = require('puppeteer');
const config = require('./config');
const {
  isNumber,
  isEmpty,
  reduce,
} = require('lodash');
const {checked, traverse} = require('./lib/traverse');


const {startUrl} = config;

(async () => {
  console.log('[SV] start');
  if (!startUrl) {
    throw new Error('[SV] No start URL');
  }

  let browser;
  try {
    browser = await puppeteer.launch();
    const page = await browser.newPage();
    await traverse(page, startUrl);

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
  } catch (e) {
    console.error(e);
  }
  await browser.close();
  console.log('[SV] over');
})();
