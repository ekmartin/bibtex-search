const test = require('ava');
const { retrieve, search, sources } = require('./');

/**
 * Note that these tests run directly against the real sources.
 * In theory they should only fail if bibtex-search would fail as well,
 * e.g. if one of the sources completely change their DOM representation.
 */

test('search() finds articles from ACM', async t => {
  const articles = await search(sources.ACM, 'bayou');
  articles.forEach(({ id, title, authors }) => {
    t.is(typeof id, 'string');
    t.is(typeof title, 'string');
    t.is(typeof authors, 'string');
  });
});

test('search() finds articles from Google Scholar', async t => {
  const articles = await search(sources.GOOGLE, 'bayou');
  articles.forEach(({ id, title, authors }) => {
    t.is(typeof id, 'string');
    t.is(typeof title, 'string');
    t.is(typeof authors, 'string');
  });
});

test('search() returns an empty array for no results from ACM', async t => {
  const articles = await search(
    sources.ACM,
    '35a33f02ce2709d03a97acbc0a73db0d'
  );

  t.deepEqual(articles, []);
});

test('search() returns an empty array for no results from Google Scholar', async t => {
  const articles = await search(
    sources.GOOGLE,
    '35a33f02ce2709d03a97acbc0a73db0d'
  );

  t.deepEqual(articles, []);
});

test('retrieve() downloads references from ACM', async t => {
  const id = '342780';
  const reference = await retrieve(sources.ACM, id);
  t.is(
    reference,
    `@incollection{Terry:1999:MUC:303461.342780,
 author = {Terry, Douglas B. and Theimer, Marvin M. and Peterson, Karin and Demers, Alan J. and Spreitzer, Mike J. and Hauser, Carl H.},
 chapter = {Managing Update Conflicts in Bayou, a Weakly Connected Replicated Storage System},
 title = {Mobility},
 editor = {Miloji\\v{c}i\\&cacute, Dejan and Douglis, Frederick and Wheeler, Richard},
 year = {1999},
 isbn = {0-201-37928-7},
 pages = {322--334},
 numpages = {13},
 url = {http://dl.acm.org/citation.cfm?id=303461.342780},
 acmid = {342780},
 publisher = {ACM Press/Addison-Wesley Publishing Co.},
 address = {New York, NY, USA},
}`
  );
});

test('retrieve() downloads references from Google Scholar', async t => {
  const id = 'PC7aDX_Xk7sJ';
  const reference = await retrieve(sources.GOOGLE, id);
  t.is(
    reference,
    `@inproceedings{terry1995managing,
  title={Managing update conflicts in Bayou, a weakly connected replicated storage system},
  author={Terry, Douglas B and Theimer, Marvin M and Petersen, Karin and Demers, Alan J and Spreitzer, Mike J and Hauser, Carl H},
  booktitle={ACM SIGOPS Operating Systems Review},
  volume={29},
  number={5},
  pages={172--182},
  year={1995},
  organization={ACM}
}`
  );
});
