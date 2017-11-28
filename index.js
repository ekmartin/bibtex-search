#!/usr/bin/env node
'use strict';

const querystring = require('querystring');
const got = require('got');
const cheerio = require('cheerio');
const meow = require('meow');
const inquirer = require('inquirer');
const ora = require('ora');
const clipboardy = require('clipboardy');
const chalk = require('chalk');
const hyperlinker = require('hyperlinker');

const MAX_ARTICLES = 10;
const ACM_BASE = 'https://dl.acm.org';
const ACM_SEARCH_URL = `${ACM_BASE}/results.cfm`;
const ACM_REFERENCE_URL = `${ACM_BASE}/exportformats.cfm`;

/**
 * Searches ACM for the given query, returning an array of articles.
 */
async function search(query) {
  const res = await got(ACM_SEARCH_URL, { query: { query } });
  const selector = cheerio.load(res.body);
  const detailsSelector = selector('.details');
  return detailsSelector.toArray().map(article => {
    const articleSelector = selector(article);
    const link = articleSelector.find('.title > a[href^=citation]');
    const title = link.text();
    const authors = articleSelector
      .find('.authors > a')
      .toArray()
      .map(author => selector(author).text())
      .join(', ');

    const url = link.attr('href');
    const { id } = querystring.parse(url.split('?').pop());
    return {
      id,
      title,
      authors,
      href: `${ACM_BASE}/${url}`
    };
  });
}

/**
 * Retrieves the BibTeX reference for a given ACM ID.
 */
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
  const choices = articles.map(({ id, href, title, authors }, i) => {
    const prefix = hyperlinker(title, href);
    const suffix = chalk.dim(`(${authors})`);
    return {
      value: id,
      name: `${prefix} ${suffix}`
    };
  });

  return [
    {
      choices,
      pageSize: Infinity,
      type: 'list',
      name: 'article',
      message: 'Which article are you looking for?'
    }
  ];
}

async function main() {
  const query = cli.input.join(' ');
  if (!query) cli.showHelp();
  const spinner = ora(`Searching for '${query}'`).start();
  let articles;
  try {
    articles = await search(query);
    articles = articles.slice(0, MAX_ARTICLES);
    spinner.stop();
  } catch (e) {
    spinner.fail(`Something went wrong while searching: ${e}`);
    process.exit(1);
  }

  if (!articles.length) {
    spinner.info(`No results found for query '${query}'.`);
    process.exit(0);
  }

  const questions = buildQuestions(articles);
  const { article } = await inquirer.prompt(questions);

  spinner.start('Retrieving BibTeX reference');
  let reference;
  try {
    reference = await retrieveReference(article);
  } catch (e) {
    spinner.fail(`Something went wrong while retrieving reference: ${e}`);
    process.exit(1);
  }

  spinner.stop();
  console.log(reference);
  clipboardy.writeSync(reference);
  spinner.succeed('Copied to clipboard!');
}

main();
