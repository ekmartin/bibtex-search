const querystring = require('querystring');
const got = require('got');
const cheerio = require('cheerio');
const meow = require('meow');
const inquirer = require('inquirer');

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

function buildQuestions(articles) {
  const choices = articles.map(({ id, title, authors }, i) => ({
    value: id,
    name: `${title} (${authors})`
  }));

  return [
    {
      choices,
      pageSize: articles.length,
      type: 'list',
      name: 'article',
      message: 'Which article are you looking for?'
    }
  ];
}

async function main() {
  const articles = await search(cli.input[0]);
  const questions = buildQuestions(articles);
  const { article } = await inquirer.prompt(questions);
  const reference = await retrieveReference(article);
  console.log(reference);
}

main();
