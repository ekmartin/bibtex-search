const querystring = require('querystring');
const got = require('got');
const cheerio = require('cheerio');
const meow = require('meow');

const ACM_SEARCH_URL = 'https://dl.acm.org/results.cfm';
const ACM_REFERENCE_URL = 'https://dl.acm.org/exportformats.cfm';

async function search(query) {
  const res = await got(ACM_SEARCH_URL, { query: { query } });
  const selector = cheerio.load(res.body);
  const detailsSelector = selector('.details');
  return detailsSelector.toArray().map(article => {
    const articleSelector = selector(article);
    const link = articleSelector.find('.title > a');
    const title = link.text();
    const authors = articleSelector
      .find('.authors > a')
      .toArray()
      .map(author => selector(author).text())
      .join(', ');

    const { id } = querystring.parse(
      link
        .attr('href')
        .split('?')
        .pop()
    );

    return { id, title, authors };
  });
}

async function retrieveReference(id) {
  const query = {
    id,
    expformat: 'bibtex'
  };

  const res = await got(ACM_REFERENCE_URL, { query });
  const selector = cheerio.load(res.body);
  return selector(`pre[id=${id}]`).text();
}

const cli = meow(`
  Searches for BibTeX references.

  Usage:
    $ bibtex-search <query>
`);

async function main() {
  const articles = await search(cli.input[0]);
  const reference = await retrieveReference(articles[1].id);
  console.log(reference);
}

main();
