(function () {

  var template = chrome.extension.getURL('box.html');
  var currentDate = function() {
    return new Date().toLocaleDateString('en-US');
  };

  var storage = {
    /**
     * [ASYNC] Request the latest likes count from background page.
     * @param  callback should be of the form function(response) {...}
     *                  where likes is the retrieved like count
     */
    getLikes: function (callback) {
      chrome.runtime.sendMessage({type: 'requestLikes'}, callback);
    },
    getLikesLimit: function (callback) {
      chrome.runtime.sendMessage({type: 'requestLikesLimit'}, callback);
    },
    getTimeSpent: function () {
      var timeSpent = parseInt(localStorage.getItem(currentDate() + '-time-spent'));
      return isNaN(timeSpent) ? 0 : timeSpent;
    },
    saveTimeSpent: function (time) {
      localStorage.setItem(currentDate() + '-time-spent', time);
    }
  };

  var timer = {
    clock: null,
    currentTimeSpent: storage.getTimeSpent(),
    timeFormat: function (totalSeconds) {
      function formatForTen (value) {
        return value < 10 ? '0' + value.toString() : value.toString();
      }
      var hours =  Math.floor(totalSeconds / 3600).toString();
      var totalSeconds = totalSeconds % 3600;
      var minutes = Math.floor(totalSeconds / 60).toString();
      minutes = hours > 0 ? formatForTen(minutes) : minutes;
      var seconds = (totalSeconds % 60);
      seconds = formatForTen(seconds);
      return (hours > 0 ? hours + ':' : '') + minutes + ':' + seconds;
    },
    startTimer: function () {
      var that = this;
      this.stopTimer();
      this.clock = setInterval(function () {
        that.currentTimeSpent++;
        $('.fbus-time-spent').text(that.timeFormat(that.currentTimeSpent));
      }, 1000);
    },
    stopTimer: function () {
      clearInterval(this.clock);
    }
  };

  $.ajax({
    url: template,
    async: false,
    success: function (html) {
      var countBox = $(html);
      $('body').append(countBox);
      init();
    }
  });

  /**
   * Callback to process a message from another sender.
   * Mainly used to be added as onMessage callback.
   */
  function onMessage (message, sender, sendResponse) {
    // New likes triggered from a tab
    if (message.type && message.type == 'updateLike') {
      $('.fbus-count').text(message.likes);
    // New likes triggered from a tab
    } else if (message.type && message.type == 'updateLikesLimit') {
      $('.fbus-limit').text(message.likesLimit);
    // A like has been blocked due to reaching daily limit
    } else if (message.type && message.type == 'likeBlocked') {
      alert('Sorry, no more likes for you today!');
    }
  }

  function init () {
    storage.getLikes(onMessage);
    storage.getLikesLimit(onMessage);

    $('.fbus-time-spent').text(timer.timeFormat(timer.currentTimeSpent));

    var optionsURL = chrome.extension.getURL('options.html');
    $('.fbus-settings').attr('href', optionsURL);

    chrome.runtime.onMessage.addListener(onMessage);

    $(window).on('focus', function () {
      timer.currentTimeSpent = storage.getTimeSpent();
      $('.fbus-time-spent').text(timer.timeFormat(timer.currentTimeSpent));
      timer.startTimer();
    });

    $(window).on('blur beforeunload', function () {
      storage.saveTimeSpent(timer.currentTimeSpent);
      timer.stopTimer();
    });

    timer.startTimer();
  }
})();
