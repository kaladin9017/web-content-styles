'use strict';

(function() {

  // Delay before showing an MT message
  var DELAY_MT_DISPLAY = 500;

  // Delay before showing the MO options
  var DELAY_MO_DISPLAY = 1000;

  // Duration of display animations
  var DISPLAY_ANIM_DURATION = 750;

  // Queue for storing up messages to display
  var MESSAGE_QUEUE = [];

  $(document).ready(function() {
    loadDailyShine();
  });

  /**
   * Fetches and displays the start of the Daily Shine content.
   */
  function loadDailyShine() {
    // Use the current date to find the corresponding content file
    // var date = new Date();
var date = new Date('2016-08-26T12:00');
    var year = date.getFullYear();
    var month = date.getMonth() + 1 >= 10 ? date.getMonth() + 1 : '0' + (date.getMonth() + 1);
    var day = date.getDate() >= 10 ? date.getDate() : '0' + date.getDate();
    var filename = year + '-' + month + '-' + day;
    var url = contentBaseUrl + 'dailyshine/' + filename + '.json';

    // Fetch the Daily Shine data and display the starter message.
    $.get({
      url: url,
      data: null,
      success: function(data) {
        displayMT(data.starterMessage['en-US'].fields);
      },
      dataType: 'json',
    });
  }

  /**
   * Displays content as an MT message.
   *
   * @param content Content of the message to display
   */
  function displayMT(content) {
    var data;
    var html;
    var template;
    var nextMessages;

    template = $('#template-mt').html();

    data = {
      message: localized(content.body),
      linkTitle: localized(content.linkTitle),
      linkUrl: localized(content.linkUrl),
    };

    // Render the template and add the message to the screen
    html = ejs.render(template, data, {delimiter: '?'});
    $('#container-messages').append(html)
        .children(':last')
        .hide()
        .delay(DELAY_MT_DISPLAY)
        .fadeIn(DISPLAY_ANIM_DURATION);

    // Fetch MO options to show the user, if any
    var nextMessages = localized(content.nextMessages);
    if (nextMessages && nextMessages.length > 0) {
      loadMOChoices(nextMessages);
    }
  }

  /**
   * Fetch and display the MO choices for the user.
   */
  function loadMOChoices(messages) {
    // @todo For now, just handling one MO option to display
    var id = messages[0].sys.id;
    var url = contentBaseUrl + 'messages/' + id + '.json';

    $.get({
      url: url,
      data: null,
      success: function(data) {
        displayMOChoices(data);
      },
      dataType: 'json',
    });
  }

  /**
   * Displays the MO options for the user to choose from.
   *
   * @param content Message content obj. Inludes the `label` property that
   *                defines what the choices should be.
   */
  function displayMOChoices(content) {
    var data;
    var element;
    var html
    var template;

    template = $('#template-mo-choice').html();

    data = {
      label: localized(content.label),
    };

    html = ejs.render(template, data, {delimiter: '?'});
    element = $('#container-messages').append(html);
    element.children(':last')
        .hide()
        .delay(DELAY_MT_DISPLAY + DELAY_MO_DISPLAY)
        .fadeIn(DISPLAY_ANIM_DURATION);

    element.click(onClickMOChoice);

    // Add the contents of this message to the queue. When the user clicks on
    // the choice, it can then display the content it finds in the queue.
    MESSAGE_QUEUE.push(content);
  }

  /**
   * Callback when an MO choice is clicked.
   */
  function onClickMOChoice() {
    // @todo Trigger any animation that should happen here before displaying
    // the next message
    displayNextMessage();
  }

  /**
   * Displays the next message in the queue.
   */
  function displayNextMessage() {
    if (MESSAGE_QUEUE.length > 0) {
      var content = MESSAGE_QUEUE.shift();
      displayMT(content);
    }
  }

  /**
   * Helper function to deal with some content objects that have a property
   * specifying the 'en-US' locale.
   *
   * @param obj
   * @return The contents of obj, sans 'en-US'
   */
  function localized(obj) {
    if (obj && obj['en-US']) {
      return obj['en-US'];
    }
    else {
      return obj;
    }
  }

})();