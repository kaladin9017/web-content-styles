(function() {

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
    },
    dataType: 'json',
  });

})();