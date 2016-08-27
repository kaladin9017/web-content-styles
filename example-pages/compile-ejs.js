/**
 * Compiles the example data into example HTML files. Could be helpful for use
 * during development.
 */

'use strict';

const ejs = require('ejs');
const fs = require('fs');
const marked = require('marked');

/////
// Compile example article template from example data
/////
const articleJson = fs.readFileSync('article-data.json', 'utf-8');
const articleObj = JSON.parse(articleJson);
if (articleObj.author && articleObj.author.bio) {
  articleObj.author.bio = marked(articleObj.author.bio);
}

const articleData = {
  articleAuthor: articleObj.author,
  articleBody: marked(articleObj.body['en-US']),
  articleCategory: articleObj.category ? articleObj.category['en-US'] :  undefined,
  articleDate: formatDisplayDate(new Date(articleObj.date['en-US'])),
  articleDescription: articleObj.description ? articleObj.description['en-US'] : undefined,
  articleHeaderPhoto: articleObj.headerPhoto ? `https:${articleObj.headerPhoto.file.url}` : undefined,
  articleTags: articleObj.tags['en-US'],
  articleTitle: articleObj.title['en-US'],
  articleUrlPath: articleObj.urlPath,
  css: '../_tmp/styles.css',
  jsPath: '..',
  pageTitle: `${articleObj.title['en-US']} | Shine`,
};

compile('../templates/article.ejs', 'example-article.html', articleData);

/////
// Compile example author template from example data
/////
const authorJson = fs.readFileSync('author-data.json', 'utf-8');
const authorObj = JSON.parse(authorJson);

const authorData = {
  authorBio: authorObj.bio ? marked(authorObj.bio['en-US']) : undefined,
  authorName: authorObj.name['en-US'],
  authorPicture: `https:${authorObj.picture.file.url}`,
  authorInstagram: authorObj.instagram ? authorObj.instagram['en-US'] : undefined,
  authorFacebook: authorObj.facebook ? authorObj.facebook['en-US'] : undefined,
  authorTwitter: authorObj.twitter ? authorObj.twitter['en-US'] : undefined,
  css: '../_tmp/styles.css',
  pageTitle: `${authorObj.name['en-US']} | Shine`,
};

compile('../templates/author.ejs', 'example-author.html', authorData);

/////
// Compile example advice home template
/////
const adviceData = {
  css: '../_tmp/styles.css',
  jsPath: '..',
  articlesJsonUrl: 'http://advice.shinetext.com/articles/all.json', // <---- change this to adjust test content used
  featuredJsonUrl: 'http://advice.shinetext.com/articles/featured.json', // <---- change this to adjust test content used
};

compile('../templates/advice-home.ejs', 'example-advice-home.html', adviceData);

/////
// Compile example daily web template
/////
const dailyData = {
  css: '../_tmp/dailyshine.css',
  jsPath: '..',

  contentBaseUrl: process.env.DAILYSHINE_CONTENT_BASE_URL,
};

compile('../templates/daily-shine.ejs', 'example-dailyshine.html', dailyData);

process.exit();

/**
 * Helper function to compile the template and write the output to a file.
 */
function compile(templateFilename, outputFilename, data) {
  const template = fs.readFileSync(templateFilename, 'utf-8');
  const output = ejs.render(template, data, null);
  fs.writeFileSync(outputFilename, output);
  console.log(`wrote to file: ${outputFilename}`);
}

/**
 * Formats the date to display on the site.
 * Note: Copied from prism/functions/blog/contentfulWebhook/lib/processArticle.ejs
 *
 * @param date
 * @return string
 */
function formatDisplayDate(date) {
  let month;
  const m = date.getMonth();
  switch(m) {
    case 0:
      month = 'January';
      break;
    case 1:
      month = 'February';
      break;
    case 2:
      month = 'March';
      break;
    case 3:
      month = 'April';
      break;
    case 4:
      month = 'May';
      break;
    case 5:
      month = 'June';
      break;
    case 6:
      month = 'July';
      break;
    case 7:
      month = 'August';
      break;
    case 8:
      month = 'Sepetember';
      break;
    case 9:
      month = 'October';
      break;
    case 10:
      month = 'November';
      break;
    case 11:
      month = 'December';
      break;
  }

  return `${month} ${date.getDate()}, ${date.getFullYear()}`;
}