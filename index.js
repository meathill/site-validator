#!/usr/bin/env node --experimental-repl-await

const puppeteer = require('puppeteer');
const config = require('./config');
const traverse = require('./lib/traverse');


const {startUrl} = config;

(async () => {
  console.log('[SV] start');
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const links = await traverse(page, startUrl);
    await browser.close();
    //console.table(links.map(link => new Link(link)));
  } catch (e) {
    console.error(e);
  }
  console.log('[SV] over');
})();
