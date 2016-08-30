/**
 * A script to be run on deployment.
 *
 * Compiles the advice homepage template and writes to a file that should then
 * be copied over to its appropriate S3 bucket.
 */

'use strict';

const ejs = require('ejs');
const fs = require('fs');

const templateFilename = './templates/daily-shine.ejs';
const outputFilename = './_tmp/daily-shine.html';

// Read the template file
const template = fs.readFileSync(templateFilename, 'utf-8');

// Template data
const data = {
  css: 'dailyshine.css',
  jsPath: '',
  contentBaseUrl: '/_data/',
  photonBaseUrl: process.env.PHOTON_BASE_URL || '',
};

// Render and write to file
const output = ejs.render(template, data, null);
fs.writeFileSync(outputFilename, output);

console.log(`wrote to file: ${outputFilename}`);