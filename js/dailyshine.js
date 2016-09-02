'use strict';

(function() {

  // Delay before showing an MT message
  var DELAY_MT_DISPLAY = 450;

  // Delay before showing the MO options
  var DELAY_MO_DISPLAY = 450;

  // Duration of display animations
  var DISPLAY_ANIM_DURATION = 750;

  // Duration of the viewport scroll animation
  var SCROLL_ANIM_DURATION = 1000;

  // Queue for storing up messages to display
  var MESSAGE_QUEUE = [];

  // Message counter
  var messageCounter = 1;

  // Fetched user data, if any
  var userData;

  $(document).ready(function() {
    loadUser();
  });

  /**
   * Fetch and cache user data.
   */
  function loadUser() {
    var url;
    var code = getParameter('r');

    if (code && code.length > 0) {
      url = photonBaseUrl + 'users?referralCode=' + code;

      $.get({
        url: url,
        data: null,
        dataType: 'json',
        success: function(data) {
          userData = data;

          if (userData && userData.firstName) {
            displayMT({
              body: 'Good morning, ' + userData.firstName + '!',
              intro: true,
            });
          }

          loadDailyShine();
        },
        error: function(jqXHR, textStatus, errorThrown) {
          console.error({
            status: textStatus,
            error: errorThrown,
          });

          loadDailyShine();
        },
      });
    }
    else {
      loadDailyShine();
    }
  }

  /**
   * Fetches and displays the start of the Daily Shine content.
   */
  function loadDailyShine() {
    // Use the current date to find the corresponding content file. Or if one is
    // specified in a `date` param, then use that.
    var date;
    if (getParameter('date')) {
      date = createDateFromQuery(getParameter('date'));
    }
    else {
      date = new Date();
    }

    var year = date.getFullYear();
    var month = date.getMonth() + 1 >= 10 ? date.getMonth() + 1 : '0' + (date.getMonth() + 1);
    var day = date.getDate() >= 10 ? date.getDate() : '0' + date.getDate();
    var filename = year + '-' + month + '-' + day;
    var url = contentBaseUrl + 'dailyshine/' + filename + '.json';

    // Fetch the Daily Shine data and display the starter message.
    $.get({
      url: url,
      data: null,
      dataType: 'json',
      success: function(data) {
        displayMT(data.starterMessage['en-US'].fields);
      },
    });
  }

  /**
   * Displays content as an MT message.
   *
   * @param content Content of the message to display
   */
  function displayMT(content) {
    var body;
    var data;
    var element;
    var html;
    var messages;
    var nextMessages;
    var template;
    var i;

    // Merge user data into the message and turn URLs into links
    body = makeLinks(mergeData(localized(content.body)));

    // Split message by new line so each message gets its own bubble
    messages = body.split('\n');

    // Remove empty entries
    for (i = messages.length - 1; i >= 0; i--) {
      if (messages[i].length == 0 ||
          (messages[i].length == 1 && messages[i].charCodeAt(0) == 13)) {
        messages.splice(i, 1);
      }
    }

    // Display the media asset first if there is one
    if (content.media) {
      messages.unshift({
        media: content.media.fields.file.url,
      });
    }

    for (i = 0; i < messages.length; i++) {
      if (typeof messages[i] === 'object') {
        data = messages[i];
      }
      else if (typeof messages[i] === 'string') {
        data = {
          message: messages[i].trim(),
        };

        // Only set link in the last message
        if (i == messages.length - 1) {
          data.linkTitle = localized(content.linkTitle);
          data.linkUrl = localized(content.linkUrl);
        }
      }

      // Render the template and add the message to the screen
      if (data.media) {
        template = $('#template-mt-media').html();
      }
      else if (data.linkTitle && data.linkUrl) {
        template = $('#template-mt-link').html();
      }
      else {
        template = $('#template-mt').html();
      }
      html = ejs.render(template, data, {delimiter: '?'});
      element = $('#container-messages').append(html).children(':last');
      element.hide()
          .delay(DELAY_MT_DISPLAY * (i + 1))
          .fadeIn(DISPLAY_ANIM_DURATION);
    }

    // Fetch MO options to show the user, if any
    var displayDelay = DELAY_MT_DISPLAY * messages.length;
    var nextMessages = localized(content.nextMessages);
    if (nextMessages && nextMessages.length > 0) {
      loadMOChoices(nextMessages, displayDelay);
    }
    else if (! content.intro) {
      onMessagesFinished(displayDelay);
    }
  }

  /**
   * Fetch and display the MO choices for the user.
   *
   * @param messages
   * @param additionalDelay Additional delay before displaying the MO choices
   */
  function loadMOChoices(messages, additionalDelay) {
    var id;
    var url;
    var i;
    var messageData = [];
    var numMessages = messages.length;
    var requestCounter = 0;

    for (i = 0; i < messages.length; i++) {
      id = messages[i].sys.id;
      url = contentBaseUrl + 'messages/' + id + '.json';

      $.get({
        url: url,
        data: null,
        error: onError,
        success: onSuccess,
        dataType: 'json',
      });
    }

    function onSuccess(data) {
      requestCounter++;
      if (data) {
        messageData.push(data);
      }

      if (requestCounter == numMessages) {
        displayMOChoices(messageData, additionalDelay);
      }
    }

    function onError() {
      requestCounter++;

      if (requestCounter == numMessages) {
        displayMOChoices(messageData, additionalDelay);
      }
    }
  }

  /**
   * Displays the MO options for the user to choose from.
   *
   * @param content Message content obj. Inludes the `label` property that
   *                defines what the choices should be.
   * @param additionalDelay Additional delay before displaying the MO choices
   */
  function displayMOChoices(content, additionalDelay) {
    var container;
    var data;
    var element;
    var html;
    var id;
    var template;
    var i;

    // Create object for the container
    template = $('#template-mo-container').html();
    html = ejs.render(template, {messageCounter: messageCounter}, {delimiter: '?'});
    container = $(html);

    // Create objects for the individual choices
    for (i = 0; content && i < content.length; i++) {
      template = $('#template-mo-choice').html();
      id = 'mo-' + messageCounter + '-' + i;

      data = {
        id: id,
        label: localized(content[i].label),
      };

      html = ejs.render(template, data, {delimiter: '?'});
      element = container.append(html).children(':last');

      element.on('click', onClickMOChoice);

      // Add the contents of this message to the queue. When the user clicks on
      // the choice, it can then display the content it finds in the queue.
      MESSAGE_QUEUE.push({id: id, content: content[i]});
    }

    // Add the new content to the DOM
    $('#container-messages')
      .append(container)
      .children(':last')
      .hide()
      .delay(additionalDelay + DELAY_MO_DISPLAY)
      .fadeIn(DISPLAY_ANIM_DURATION);
  }

  /**
   * Callback when an MO choice is clicked.
   */
  function onClickMOChoice() {
    var element = $(this);

    // Changing classes triggers animations
    element.addClass('-clicked');
    element.off('click');

    displayNextMessage(element.attr('id'));

    // This feels kinda hacky, but whatever
    var delay = 750;
    setTimeout(function() {
      var start = $(window).scrollTop();
      var dist = 1000;

      $('html, body').animate({
        scrollTop: start + dist,
      }, SCROLL_ANIM_DURATION);
    }, delay);
  }

  /**
   * Displays the next message in the queue.
   *
   * @param id ID of the button that was clicked
   */
  function displayNextMessage(id) {
    var i;
    var content;
    var split;

    var checkNum;
    var messageNum = false;

    // Loop through to find the message corresponding to the id
    for (i = MESSAGE_QUEUE.length - 1; i >= 0; i--) {
      if (id == MESSAGE_QUEUE[i].id) {
        content = MESSAGE_QUEUE[i].content;

        // Find out what message this is for. Assumed id format: mo-#-#
        split = MESSAGE_QUEUE[i].id.split('-');
        messageNum = split[1];

        // Remove this item
        MESSAGE_QUEUE.splice(i, 1);
        break;
      }
    }

    // Loop through again to find any messages that we should now remove
    for (i = MESSAGE_QUEUE.length - 1; messageNum != -1 && i >= 0; i--) {
      split = MESSAGE_QUEUE[i].id.split('-');
      checkNum = split[1];
      if (checkNum == messageNum) {
        $('#' + MESSAGE_QUEUE[i].id).hide();
        MESSAGE_QUEUE.splice(i, 1);
      }
    }

    messageCounter++;
    displayMT(content);
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

  /**
   * Search for URLs in a body of text and convert them to links.
   *
   * @param text
   * @return string
   */
  function makeLinks(text) {
    var match, matches;
    var startAnchor, endAnchor;
    var preUrl, postUrl;
    var i;
    var regex = /(^|\s)((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gi;

    matches = text.match(regex);
    for (i = 0; matches && i < matches.length; i++) {
      match = matches[0].trim();
      if (match.indexOf('http') >= 0 && text.indexOf(match) >= 0) {
        startAnchor = '<a href="' + match + '" target="_blank">';
        endAnchor = '</a>';
        preUrl = text.substr(0, text.indexOf(match));
        postUrl = text.substr(text.indexOf(match) + match.length);

        text = preUrl + startAnchor + match + endAnchor + postUrl;
      }
    }

    return text;
  }

  /**
   * Merge user data into the message.
   *
   * @param msg
   * @return string
   */
  function mergeData(msg) {
    var merged = msg;
    var codeTag = '{{referral_code}}';
    var fnameTag = '{{first_name}}';

    var codeIdx = merged.indexOf(codeTag);
    var fnameIdx = merged.indexOf(fnameTag);

    var msgP1, msgP2;

    if (codeIdx >= 0) {
      msgP1 = merged.substring(0, codeIdx);
      msgP2 = merged.substring(codeIdx + codeTag.length);
      merged = msgP1 + userData.referralCode + msgP2;
    }

    if (fnameIdx >= 0) {
      msgP1 = merged.substring(0, fnameIdx);
      msgP2 = merged.substring(fnameIdx + fnameTag.length);

      if (userData && userData.firstName) {
        merged = msgP1 + userData.firstName + msgP2;
      }
      // Special case, if there's a ', ' before {{first_name}} and we don't have
      // first name, then leave blank and also remove the ', '.
      else if (fnameIdx > 2 && msgP1.substr(-2) == ', ') {
        merged = msgP1.substring(0, msgP1.length - 2) + msgP2;
      }
      else {
        merged = msgP1 + msgP2;
      }
    }

    return merged;
  }

  /**
   * Helper function to parse the url query params.
   * @credit: http://stackoverflow.com/a/901144
   *
   * @param name The name of the param
   * @return string
   */
  function getParameter(name) {
    var url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  /**
   * Helper function to create a Date object from the date query param. Different
   * browsers seem to handle Date.parse differently, so this is a really basic,
   * non-robust way of us handling it.
   * Note: the expected format from the query is MM-dd-YYYY
   *
   * @param strDate
   * @return Date object
   */
  function createDateFromQuery(strDate) {
    var parts = strDate.split('-');
    if (parts.length != 3) {
      // Default to just letting Date.parse do its thing if it can
      return new Date(strDate);
    }

    var month = parseInt(parts[0]) - 1; // month is 0-indexed
    var day = parts[1];
    var year = parts[2];
    return new Date(year, month, day);
  }

  /**
   * Logic to run once the end of the messaging flow has been reached.
   *
   * @param displayDelay
   */
  function onMessagesFinished(displayDelay) {
    var data;
    var date;
    var dateQuery;
    var endMessage;
    var html;
    var template;
    var month, day, year;

    // Display the end CTA section
    template = $('#template-daily-end').html();

    // Set the date query string for the share link
    if (getParameter('date')) {
      date = createDateFromQuery(getParameter('date'));
    }
    else {
      date = new Date();
    }

    year = date.getFullYear();
    month = date.getMonth() + 1 >= 10 ? date.getMonth() + 1 : '0' + (date.getMonth() + 1);
    day = date.getDate() >= 10 ? date.getDate() : '0' + date.getDate();
    dateQuery = month + '-' + day + '-' + year;
    // Note: for some reason `new Date('MM-dd-YYYY')` works, but
    //   `new Date('YYYY-MM-dd')` sets date a day behind.

    data = {
      // Used for the share link
      shareLink: 'http://' + window.location.hostname + '?date=' + dateQuery,
      showSignUp: getParameter('r') ? false : true,
    };

    html = ejs.render(template, data, {delimiter: '?'});
    $('#end-section')
      .append(html)
      .delay(displayDelay + DELAY_MO_DISPLAY)
      .fadeIn(DISPLAY_ANIM_DURATION);

    // Send GA event
    if (ga) {
      ga('send', {
        hitType: 'event',
        eventCategory: 'end',
        eventAction: 'reached',
        eventLabel: dateQuery,
      });
    }
  }

})();