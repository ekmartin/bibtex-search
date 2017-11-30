# bibtex-search [![DroneCI](https://ci.abakus.no/api/badges/ekmartin/bibtex-search/status.svg?branch=master)](https://ci.abakus.no/ekmartin/bibtex-search)

> Command-line interface for retrieving BibTeX references

![bibtex-search](https://i.imgur.com/ARhwzbQ.gif)

Currently uses [ACM's Digital Library](https://dl.acm.org/) and
[Google Scholar](https://scholar.google.com/) to find papers, but might support
other sources in the future.

## Installation

bibtex-search needs at least version 7.6 of Node.js installed.

```bash
$ npm install --global bibtex-search
```

## Usage

```bash
$ bibtex-search <query>

Options:
  --source, -s Where to find papers from - valid options: [google, acm]

Examples:
  $ bibtex-search bayou
  $ bibtex-search --source google zaharia spark
```
