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
const langNotMatch = [];
const skipped = new Set();
const pageOptions = {
  waitUntil: 'networkidle2',
  timeout,
};

async function traverse(page, source, url) {
  console.log('[SV] page: ', url);
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

  const text = await response.text();
  const chineseCount =  text.match(/[\u4E00-\u9FA5]/g) ? text.match(/[\u4E00-\u9FA5]/g).length : 0;
  const sourceLang = source.indexOf('/cn/') === -1 ? 'en' : 'cn';

  const notCN = sourceLang === 'cn' && chineseCount <= 10;
  const notEN = sourceLang === 'en' && chineseCount > 10;
  const samePage = source.replace('/cn/', '/en/') === url || url.replace('/cn/', '/en/') === source;

  if((notCN || notEN) && !samePage) {
    langNotMatch.push({source, destination: url, type: sourceLang === 'cn' ? 'cn -> en' : 'en -> cn'});
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
    if (href in checked || Array.from(links).find(link => {
      return link.href === href;
    })) {
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

    console.log('[SV] url added: ', href);
    links.add({source: page.url(), href});
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
    return traverse(page, link.source, link.href);
  }
}

async function crawl(page, startUrl) {
  await traverse(page, startUrl, startUrl);
  return {checked, langNotMatch};
}

module.exports = {
  crawl,
};
