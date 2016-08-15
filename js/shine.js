window.onload = function() {

  'use strict';

  /**
   * Get article data to display.
   */
  $.get({
    url: `${articlesJsonUrl}`,
    data: null,
    success: (data) => {
      if (! data) { return; }

      const template = $('#article-preview-template').html();
      for (let i = 0; i < data.length; i++) {
        // Extract data and prep for rendering
        const articleData = {
          article: {
            photo: `http:${data[i].headerPhoto.file.url}?w=640`,
            title: data[i].title['en-US'],
            urlPath: data[i].urlPath,
          },
          author: {
            name: data[i].author.name,
            photo: `http:${data[i].author.picture.file.url}?fit=thumb&w=100&h=100`,
          },
        };

        // Render template with data
        const html = ejs.render(template, articleData, {delimiter: '?'});

        // Add content to the page
        $('#recent-articles').append(html);
      }

      // Now that articles are in place, can enable the parallax scrolling
      refreshSkrollr();
    },
    dataType: 'json',
  });

  /**
   * Get featured data to display.
   */
  $.get({
    url: `${featuredJsonUrl}`,
    data: null,
    success: (data) => {
      if (! data || data.length === 0) { return; }

      const template = $('#featured-item-template').html();

      // @todo For now just featuring one article. So if more are here, just ignore them.
      const featuredData = {
        article: {
          description: data[0].description['en-US'],
          photo: `http:${data[0].headerPhoto.file.url}?w=900`,
          title: data[0].title['en-US'],
          urlPath: data[0].urlPath,
        },
        author: {
          photo: `http:${data[0].author.picture.file.url}?fit=thumb&w=100&h=100`,
          name: data[0].author.name,
        },
      };

      const html = ejs.render(template, featuredData, {delimiter: '?'});

      $('#featured-container').append(html);
    },
    dataType: 'json',
  });

};

/**
 * Initialize/refresh skrollr for when parallax elements get added to the DOM.
 */
var skrollrInitialized = false;
var skrollrIsMobile = false;
function refreshSkrollr() {
  if (! skrollrInitialized) {
    skrollrInitialized = true;

    var s = skrollr.init();
    if (s.isMobile()) {
      skrollrIsMobile = true;
      s.destroy();
    }
  }
  else if (! skrollrIsMobile) {
    skrollr.refresh();
  }
}