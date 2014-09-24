(function () {

  var template = chrome.extension.getURL('box.html');
  var currentDate = new Date().toLocaleDateString('en-US');
  var LIKES_LIMIT = 10;
  var currentLikes = localStorage.getItem(currentDate + '-likes');
  if (!currentLikes) {
    currentLikes = 0;
  }

  var currentTimeSpent = localStorage.getItem(currentDate + '-time-spent');
  if (!currentTimeSpent) {
    currentTimeSpent = 0;
  }

  $.ajax({
    url: template,
    async: false,
    success: function (html) {
      var countBox = $(html);
      $('body').append(countBox);
      init();
    }
  });

  function timeFormat (totalSeconds) {
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
  }

  function init () {
    $('.fbll-count').text(currentLikes);
    $('.fbll-limit').text(LIKES_LIMIT);
    $('.fbll-time-spent').text(timeFormat(currentTimeSpent));

    $('body').on('click', '.UFILikeLink', function (e) { 
      if (currentLikes < LIKES_LIMIT) {
        currentLikes++;
        $('.fbll-count').text(currentLikes);
        localStorage.setItem(currentDate + '-likes', currentLikes);
      } else {
        alert('Sorry, no more likes for you today!');
        e.preventDefault();
        e.stopPropagation();
      }
    });

    var timer = null;

    function startTimer () {
      clearInterval(timer);
      timer = setInterval(function () {
        currentTimeSpent++;
        $('.fbll-time-spent').text(timeFormat(currentTimeSpent));
      }, 1000);
    }

    function stopTimer () {
      clearInterval(timer);
    }

    $(window).on('focus', function () {
      currentTimeSpent = localStorage.getItem(currentDate + '-time-spent');
      $('.fbll-time-spent').text(timeFormat(currentTimeSpent));
      startTimer();
    });

    $(window).on('blur', function () {
      localStorage.setItem(currentDate + '-time-spent', currentTimeSpent);
      stopTimer();
    });

    window.onbeforeunload = function(event) {
      localStorage.setItem(currentDate + '-time-spent', currentTimeSpent);
    };

    startTimer();
  }  
})();
