'use strict';

(function() {

  // Delay before showing an MT message
  var DELAY_MT_DISPLAY = 500;

  // Delay before showing the MO options
  var DELAY_MO_DISPLAY = 1250;

  // Duration of display animations
  var DISPLAY_ANIM_DURATION = 750;

  // Duration of the viewport scroll animation
  var SCROLL_ANIM_DURATION = 1000;

  // A bucket of random messages someone could receive at the end
  var END_MESSAGES = [
    'Some randomized copy can go here #ShineOn 🌟',
  ];

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
    var code = getUserCode();

    if (code && code.length > 0) {
      url = photonBaseUrl + 'users?referralCode=' + code;

      $.get({
        url: url,
        data: null,
        dataType: 'json',
        success: function(data) {
          userData = data;

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
      date = new Date(getParameter('date'));
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
    var body;
    var data;
    var element;
    var html;
    var messages;
    var nextMessages;
    var template;
    var i;

    template = $('#template-mt').html();

    // Merge user data into the message
    body = mergeData(localized(content.body));

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
      html = ejs.render(template, data, {delimiter: '?'});
      element = $('#container-messages').append(html).children(':last');
      element.hide()
          .delay(DELAY_MT_DISPLAY * (i + 1))
          .fadeIn(DISPLAY_ANIM_DURATION);
    }

    // Fetch MO options to show the user, if any
    var nextMessages = localized(content.nextMessages);
    if (nextMessages && nextMessages.length > 0) {
      loadMOChoices(nextMessages);
    }
    else {
      onMessagesFinished();
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
      messageNum: messageCounter,
    };

    html = ejs.render(template, data, {delimiter: '?'});
    element = $('#container-messages').append(html).children(':last');
    element.hide()
        .delay(DELAY_MT_DISPLAY + DELAY_MO_DISPLAY)
        .fadeIn(DISPLAY_ANIM_DURATION);

    $('#mo-' + messageCounter).on('click', onClickMOChoice);

    // Add the contents of this message to the queue. When the user clicks on
    // the choice, it can then display the content it finds in the queue.
    MESSAGE_QUEUE.push(content);
  }

  /**
   * Callback when an MO choice is clicked.
   */
  function onClickMOChoice() {
    var element = $(this);

    // @todo Trigger any animation that should happen here before displaying
    // the next message
    element.removeClass('mo-choice');
    element.addClass('mo');
    element.off('click');

    displayNextMessage();

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
   */
  function displayNextMessage() {
    if (MESSAGE_QUEUE.length > 0) {
      messageCounter++;

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
   * Helper function for extracting the user's referral code to use their
   * identifier to get more info.
   *
   * @return string
   */
  function getUserCode() {
    var code;
    var path;

    // Expecting to be able to extract the code from the URL
    if (getParameter('referralCode')) {
      code = getParameter('referralCode');
    }
    else {
      path = window.location.pathname.split('/');
      code = path.indexOf(path.length - 1);
    }

    return code;
  }

  /**
   * Logic to run once the end of the messaging flow has been reached.
   */
  function onMessagesFinished() {
    var data;
    var date;
    var dateQuery;
    var element;
    var endMessage;
    var html;
    var template;
    var month, day, year;

    // Display the end CTA section
    template = $('#template-daily-end').html();

    // Set the date query string for the share link
    if (getParameter('date')) {
      date = new Date(getParameter('date'));
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
      showCTA: getUserCode() ? false : true,
      // Randomly select an end message
      endMessage: END_MESSAGES[Math.floor(Math.random() * END_MESSAGES.length)],
    };

    html = ejs.render(template, data, {delimiter: '?'});
    element = $('#container-messages').append(html).children(':last');
    element.hide()
        .delay(DELAY_MT_DISPLAY + DELAY_MO_DISPLAY)
        .fadeIn(DISPLAY_ANIM_DURATION);
  }

})();