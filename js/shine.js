(function() {

  // The number of articles to display at a time
  var NUM_ARTICLES_DISPLAY_BATCH = 9;

  // Message to replace the "Read More" button when we reach the end of available articles
  var READ_MORE_END_MESSAGE = 'Check back later for more';

  // Array of articles fetched from the server
  var fetchedArticles = [];

  // Number of articles currently displayed in the view
  var numDisplayedArticles = 0;

  // Helpers for managing the skrollr lib
  var skrollrInitialized = false;
  var skrollrIsMobile = false;
  var skrollrInstance;

  window.onload = function() {

    'use strict';

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
    const template = $('#article-preview-template').html();

    let startIndex = numDisplayedArticles;
    for (let i = startIndex; i < startIndex + NUM_ARTICLES_DISPLAY_BATCH && i < fetchedArticles.length; i++) {
      // Extract data and prep for rendering
      const articleData = {
        article: {
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
      const html = ejs.render(template, articleData, {delimiter: '?'});

      // Add content to the page
      $('#recent-articles').append(html).children(':last').hide().fadeIn(500);

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