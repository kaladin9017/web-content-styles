'use strict';

(function() {

  // The number of articles to display at a time
  var NUM_ARTICLES_DISPLAY_BATCH = 9;

  // Message to replace the "Read More" button when we reach the end of available articles
  var READ_MORE_END_MESSAGE = ':)';

  // Array of articles fetched from the server
  var fetchedArticles = [];

  // Number of articles currently displayed in the view
  var numDisplayedArticles = 0;

  // Helpers for managing the skrollr lib
  var skrollrInitialized = false;
  var skrollrIsMobile = false;
  var skrollrInstance;

  window.onload = function() {

    // Load more articles when the #read-more button is clicked
    $('#read-more').click(loadMoreArticles);

    // Load the initial batch of articles
    loadMoreArticles();

    /**
     * Get featured data to display.
     */
    $.get({
      url: `${featuredJsonUrl}`,
      data: null,
      success: function (data) {
        var featuredData;
        var renderedHtml;
        var template;

        if (! data || data.length === 0) { return; }

        template = $('#featured-item-template').html();

        // @todo For now just featuring one article. So if more are here, just ignore them.
        featuredData = {
          article: {
            category: data[0].category['en-US'],
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

        renderedHtml = ejs.render(template, featuredData, {delimiter: '?'});

        $('#featured-container').append(renderedHtml);
      },
      dataType: 'json',
    });

  };

  /**
   * Initialize/refresh skrollr for when parallax elements get added to the DOM.
   */
  function refreshSkrollr() {
    if (! skrollrInitialized) {
      skrollrInitialized = true;

      skrollrInstance = skrollr.init();
      if (skrollrInstance.isMobile()) {
        skrollrIsMobile = true;
        skrollrInstance.destroy();
      }
    }
    else if (! skrollrIsMobile) {
      skrollrInstance.refresh();
    }
  }

  /**
   * Fetches and displays articles to display. If we've already fetched the
   * json of articles, then display the next round of articles.
   */
  function loadMoreArticles() {
    if (! fetchedArticles || fetchedArticles.length == 0) {
      $.get({
        url: `${articlesJsonUrl}`,
        data: null,
        success: onGetArticles,
        dataType: 'json',
      });
    }
    else {
      displayMoreArticles();
    }
  }

  /**
   * Callback when articles are fetched from the server. Cache to a local array
   * and display a batch of articles.
   */
  function onGetArticles(data) {
    if (! data) { return; }

    fetchedArticles = data;

    displayMoreArticles();
  }

  /**
   * Starting from the current number of displayed articles, display
   * NUM_ARTICLES_DISPLAY_BATCH more to the view.
   */
  function displayMoreArticles() {
    var articleData;
    var renderedHtml;
    var startIndex;
    var template;
    var i;

    template = $('#article-preview-template').html();

    startIndex = numDisplayedArticles;
    for (i = startIndex; i < startIndex + NUM_ARTICLES_DISPLAY_BATCH && i < fetchedArticles.length; i++) {
      // Extract data and prep for rendering
      articleData = {
        article: {
          category: fetchedArticles[i].category ? fetchedArticles[i].category['en-US'] : undefined,
          photo: `http:${fetchedArticles[i].headerPhoto.file.url}?w=640`,
          title: fetchedArticles[i].title['en-US'],
          urlPath: fetchedArticles[i].urlPath,
        },
        author: {
          name: fetchedArticles[i].author.name,
          photo: `http:${fetchedArticles[i].author.picture.file.url}?fit=thumb&w=100&h=100`,
        },
      };

      // Render template with data
      renderedHtml = ejs.render(template, articleData, {delimiter: '?'});

      // Add content to the page
      $('#recent-articles').append(renderedHtml).children(':last').hide().fadeIn(500);

      numDisplayedArticles++
    }

    // Now that articles are in place, can enable the parallax scrolling
    refreshSkrollr();

    // If there are no more articles, render the "Read More" button disabled
    if (numDisplayedArticles == fetchedArticles.length) {
      $('#read-more').addClass('disabled');
      $('#read-more').text(READ_MORE_END_MESSAGE);
    }
  }

})();