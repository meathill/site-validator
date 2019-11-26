const links = new Set();
const checked = new Set();

async function traverse(page, url) {
  console.log('[SV] goto: ', url);
  await page.goto(url, {
    waitUntil: 'networkidle2',
  });

  const aTags = await page.$$('a');
  const pageLinks = await Promise.all(aTags.map(async tag => {
    let href = await tag.getProperty('href');
    href = await href.jsonValue();
    const url = new URL(href);
    url.hash = '';
    href = url.toString();
    if (checked.has(href)) {
      return;
    }
    links.add(href);
    return href;
  }));
  console.log(links);
  return links;
}

module.exports = traverse;
