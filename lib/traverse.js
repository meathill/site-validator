const {isString} = require('lodash');
const {
  domains,
  exclusive,
  interval,
  timeout,
} = require('../config');
const {sleep} = require('./util');

const links = new Set();
const checked = {};
const pageOptions = {
  waitUntil: 'networkidle2',
  timeout,
};

async function traverse(page, url) {
  console.log('[SV] goto: ', url);
  let response;
  try {
    if (isString(url)) {
      response = await page.goto(url, pageOptions);
    }  else {
      [response] = await Promise.all([
        page.waitForNavigation(pageOptions),
        url.click(),
      ]);
    }
  } catch (e) {
    checked[isString(url) ? url : url.href] = {
      message: e.message,
    };
    return;
  }
  const statusCode = response.status();
  checked[url] = statusCode;
  if (statusCode >= 400) {
    return;
  }

  const aTags = await page.$$('a');
  let pageLinks = await Promise.all(aTags.map(async tag => {
    let href = await tag.getProperty('href');
    href = await href.jsonValue();
    const url = new URL(href);
    if (domains && domains.indexOf(url.hostname) === -1) {
      return;
    }
    if (exclusive && exclusive.indexOf(url.hostname) !== -1) {
      return;
    }
    url.hash = '';
    href = url.toString();
    if (href in checked || links.has(href)) {
      return;
    }
    tag.href = href;
    links.add(href);
    return tag;
  }));
  pageLinks = pageLinks.filter(link => !!link);
  if (pageLinks.length > 0) {
    const [link] = pageLinks;
    if (interval) {
      await sleep(interval);
    }
    const {href} = link;
    links.delete(href);
    return traverse(page, link);
  } else if (links.size > 0) {
    const [link] =  Array.from(links);
    links.delete(link);
    return traverse(page, link);
  }
}

module.exports = {
  traverse,
  checked,
};
