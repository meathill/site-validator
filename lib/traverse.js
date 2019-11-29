const {isString} = require('lodash');
const {
  domains,
  exclusive,
  interval,
  timeout,
  skipInvisible,
} = require('../config');
const {sleep} = require('./util');

const links = new Set();
const checked = {};
const skipped = new Set();
const pageOptions = {
  waitUntil: 'networkidle2',
  timeout,
};

async function traverse(page, url) {
  let response;
  try {
    response = await page.goto(url, pageOptions);
  } catch (e) {
    checked[isString(url) ? url : url.href] = {
      message: e.message,
    };
    return;
  }
  const statusCode = response.status();
  checked[url] = statusCode;
  if (statusCode >= 400) {
    return doNext(page);
  }

  const aTags = await page.$$('a');
  await Promise.all(aTags.map(async tag => {
    let href = await tag.getProperty('href');
    href = await href.jsonValue();
    if (!href) {
      return;
    }
    const url = new URL(href);
    if (domains && domains.indexOf(url.hostname) === -1) {
      if (!skipped.has(url.hostname)) {
        console.log('[SV] skip: ', url.hostname);
      }
      skipped.add(url.hostname);
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

    if (skipInvisible) {
      const visible = await tag.evaluate(node => {
        if (node.offsetParent === null) {
          return false;
        }

        const elem = node.nodeType === Node.ELEMENT_NODE ? node : node.parentNode;
        const style = getComputedStyle(elem);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
      if (!visible) {
        return;
      }
    }

    links.add(href);
    return tag;
  }));
  return doNext(page);
}

async function doNext(page) {
  if (links.size > 0) {
    const [link] =  Array.from(links);
    links.delete(link);
    if (interval) {
      await sleep(interval);
    }
    return traverse(page, link);
  }
}

module.exports = {
  traverse,
  checked,
};
