'use strict';

const querystring = require('querystring');
const got = require('got');
const cheerio = require('cheerio');

const ACM_SEARCH_URL = 'https://dl.acm.org/results.cfm';
const ACM_REFERENCE_URL = 'https://dl.acm.org/exportformats.cfm';
const SCHOLAR_SEARCH_URL = 'https://scholar.google.com/scholar';

const sources = {
  ACM: 'ACM',
  GOOGLE: 'GOOGLE'
};

async function searchAcm(query) {
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

    const { id } = querystring.parse(
      link
        .attr('href')
        .split('?')
        .pop()
    );

    return { id, title, authors };
  });
}

async function searchScholar(query) {
  const res = await got(SCHOLAR_SEARCH_URL, {
    query: {
      q: query,
      hl: 'en'
    }
  });

  const selector = cheerio.load(res.body);
  const detailsSelector = selector('.gs_r.gs_or.gs_scl');
  return detailsSelector.toArray().map(article => {
    const articleSelector = selector(article);
    const id = articleSelector.data('cid');
    const title = articleSelector.find('.gs_rt > a').text();
    const authors = articleSelector.find('.gs_a').text();
    return { id, title, authors };
  });
}

async function retrieveAcm(id) {
  const query = {
    id,
    expformat: 'bibtex'
  };

  const res = await got(ACM_REFERENCE_URL, { query });
  const selector = cheerio.load(res.body);
  return selector(`pre[id=${id}]`)
    .text()
    .trim();
}

async function retrieveScholar(id) {
  const query = {
    q: `info:${id}:scholar.google.com/`,
    output: 'cite'
  };

  const res = await got(SCHOLAR_SEARCH_URL, { query });
  const selector = cheerio.load(res.body);
  const url = selector(`a.gs_citi:contains(BibTeX)`).attr('href');
  const refRes = await got(url);
  return refRes.body.trim();
}

/**
 * Retrieves the BibTeX reference for a given source and id.
 */
exports.retrieve = async function retrieve(source, id) {
  if (source === sources.GOOGLE) {
    return retrieveScholar(id);
  }

  return retrieveAcm(id);
};

/**
 * Searches the given source for a list of articles.
 */
exports.search = async function search(source, query) {
  if (source === sources.GOOGLE) {
    return searchScholar(query);
  }

  return searchAcm(query);
};

/**
 * Supported paper sources.
 */
exports.sources = sources;
