/**
 * A script to be run on deployment.
 *
 * Compiles the advice homepage template and writes to a file that should then
 * be copied over to its appropriate S3 bucket.
 */

'use strict';

const ejs = require('ejs');
const fs = require('fs');

const templateFilename = './templates/advice-home.ejs';
const outputFilename = './_tmp/advice-home.html';

// Read the template file
const template = fs.readFileSync(templateFilename, 'utf-8');

// Template data
const data = {
  css: 'styles.css',
  jsPath: 'js',
  articlesJsonUrl: 'articles/all.json',
};

// Render and write to file
const output = ejs.render(template, data, null);
fs.writeFileSync(outputFilename, output);

console.log(`wrote to file: ${outputFilename}`);