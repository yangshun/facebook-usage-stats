(function () {

  var template = chrome.extension.getURL('box.html');
  var currentDate = function() {
    return new Date().toLocaleDateString('en-US');
  };
  // TODO: Refactor into options
  var LIKES_LIMIT = 10;

  var storage = {
    /**
     * [ASYNC] Retrieve the current like count of the day from storage.
     * @param  callback should be of the form function(likes) {...}
     *                  where likes is the retrieved like count
     */
    getLikes: function (callback) {
      chrome.storage.local.get(currentDate() + '-likes', function(items) {
        console.log("Get Likes: ", items[currentDate() + '-likes']);
        if (items[currentDate() + '-likes']) {
          callback(items[currentDate() + '-likes']);
        } else {
          // return 0 as default value
          callback(0);
        }
      })
    },
    /**
     * [ASYNC] Sets the current like count of the day in storage.
     * @param  callback should be of the form function(likes) {...}
     *                  where likes is the like count
     */
    saveLikes: function (likes, callback) {
      var value = {};
      value[currentDate() + '-likes'] = likes;
      chrome.storage.local.set(value, function() {
        console.log("Save Likes: ", likes);
        callback(likes);
      })
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
        $('.fbll-time-spent').text(that.timeFormat(that.currentTimeSpent));
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

  function init () {
    storage.getLikes(function(likes) {
      $('.fbll-count').text(likes);
    });
    $('.fbll-limit').text(LIKES_LIMIT);
    $('.fbll-time-spent').text(timer.timeFormat(timer.currentTimeSpent));

    chrome.runtime.onMessage.addListener(
      function(message, sender, sendResponse) {
        console.log("Message from extension", message);
        // New likes triggered from a tab
        if (message.type && message.type == 'updateLike') {
          $('.fbll-count').text(message.likes);
        // A like has been blocked due to reaching daily limit
        } else if (message.type && message.type == 'likeBlocked') {
            alert('Sorry, no more likes for you today!');
        }
    });

    $(window).on('focus', function () {
      timer.currentTimeSpent = storage.getTimeSpent();
      $('.fbll-time-spent').text(timer.timeFormat(timer.currentTimeSpent));
      timer.startTimer();
    });

    $(window).on('blur beforeunload', function () {
      storage.saveTimeSpent(timer.currentTimeSpent);
      timer.stopTimer();
    });

    timer.startTimer();
  }
})();
