#!/usr/bin/env node
'use strict';

const meow = require('meow');
const ora = require('ora');
const chalk = require('chalk');
const clipboardy = require('clipboardy');
const inquirer = require('inquirer');
const { retrieve, search, sources } = require('./');

const MAX_ARTICLES = 10;
const validSources = Object.keys(sources)
  .map(s => s.toLowerCase())
  .join(', ');

const cli = meow(
  `
  Usage:
    $ bibtex-search <query>

  Options:
    --source, -s Where to find papers from (default: acm) - valid options: [${
      validSources
    }]

  Examples:
    $ bibtex-search bayou
    $ bibtex-search --source google zaharia spark
`,
  {
    flags: {
      source: {
        type: 'string',
        default: 'acm',
        alias: 's'
      }
    }
  }
);

function buildQuestions(articles) {
  const choices = articles.map(({ id, title, authors }, i) => ({
    value: id,
    name: `${title} ${chalk.dim(`(${authors})`)}`
  }));

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
  const source = cli.flags.source.toUpperCase();
  if (!query) cli.showHelp();
  if (!sources[source]) {
    const symbol = chalk.yellow('⚠');
    console.log(`${symbol} Valid sources are: ${validSources}`);
    process.exit(1);
  }

  const spinner = ora(`Searching for '${query}'`).start();
  let articles;
  try {
    articles = await search(source, query);
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
    reference = await retrieve(source, article);
  } catch (e) {
    spinner.fail(`Something went wrong while retrieving reference: ${e}`);
    process.exit(1);
  }

  spinner.stop();
  console.log(reference);
  try {
    clipboardy.writeSync(reference);
    spinner.succeed('Copied to clipboard!');
  } catch (_e) {
    // Ignore clipboard related errors - we've already
    // printed the reference nonetheless.
  }
}

main();
