(function () {

  var template = chrome.extension.getURL('box.html');
  var currentDate = new Date().toLocaleDateString('en-US');
  var LIKES_LIMIT = 10;

  var storage = {
    getLikes: function () {
      var likes = parseInt(localStorage.getItem(currentDate + '-likes'));
      return isNaN(likes) ? 0 : likes;
    },
    saveLikes: function (likes) {
      localStorage.setItem(currentDate + '-likes', likes);
    },
    getTimeSpent: function () {
      var timeSpent = parseInt(localStorage.getItem(currentDate + '-time-spent'));
      return isNaN(timeSpent) ? 0 : timeSpent;
    },
    saveTimeSpent: function (time) {
      localStorage.setItem(currentDate + '-time-spent', time);
    }
  };

  var currentLikes = storage.getLikes();

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
    $('.fbll-count').text(currentLikes);
    $('.fbll-limit').text(LIKES_LIMIT);
    $('.fbll-time-spent').text(timer.timeFormat(timer.currentTimeSpent));

    $('body').on('click', '.UFILikeLink', function (e) { 
      if (currentLikes < LIKES_LIMIT) {
        currentLikes++;
        $('.fbll-count').text(currentLikes);
        storage.saveLikes(currentLikes);
      } else {
        alert('Sorry, no more likes for you today!');
        e.preventDefault();
        e.stopPropagation();
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
