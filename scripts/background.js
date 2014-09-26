(function() {

  // Encoding API not available in chrome 37 and below
  // Using http://updates.html5rocks.com/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
  // with UTF8
  function arrayBufferToString (buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
  }

  var currentDate = function () {
    return new Date().toLocaleDateString('en-US');
  };

  var storage = {
    getLikes: function (callback) {
      var likesStorageKey = currentDate() + '-likes';
      chrome.storage.local.get(likesStorageKey, function (items) {
        console.log('Get Likes: ', items[likesStorageKey]);
        if (items[likesStorageKey]) {
          callback(items[likesStorageKey]);
        } else {
          callback(0);
        }
      });
    },
    saveLikes: function (likes, callback) {
      var newStorageItem = {};
      newStorageItem[currentDate() + '-likes'] = likes;
      chrome.storage.local.set(newStorageItem, function () {
        console.log('Save Likes: ', likes);
        callback(likes);
      });
    },
  };

  // TODO: Refactor into options
  var LIKES_LIMIT = 10;
  var currentLikes = 0;

  storage.getLikes(function (likes) {
    currentLikes = likes;
  });

  function broadcastToFacebookTabs (msg) {
    chrome.tabs.query({url: '*://*.facebook.com/*'}, function (tabs) {
      for (var i = 0; i < tabs.length; i++) {
        chrome.tabs.sendMessage(tabs[i].id, msg);
      }
    });
  }

  console.log('alive');

  chrome.runtime.onMessage.addListener(
    function (message, sender, sendResponse) {
      console.log('Message from tab', message);
      // Content script is requesting likes count
      if (message.type && message.type == 'requestLikes') {
        storage.getLikes(function (likes) {
          console.log('Sending respones via...', sendResponse);
          sendResponse({type: "updateLike", likes: likes});
        });
        // GOTCHA: since getLikes is asynchronous, return true to keep the channel open
        // so sendResponse can be called when getLike callback fires.
        // See: https://developer.chrome.com/extensions/runtime#method-sendMessage
        return true;
      }
  });

  chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
      if (details.requestBody && details.requestBody.raw) {
        var queryStr = arrayBufferToString(details.requestBody.raw[0].bytes);
        var query = URI.parseQuery(queryStr)
        if (query.like_action && query.like_action === 'true') {
          if (currentLikes < LIKES_LIMIT) {
            currentLikes++;
            storage.saveLikes(currentLikes, function (likes) {
              broadcastToFacebookTabs({
                type: 'updateLike', 
                likes: likes
              });
            });
          } else {
            chrome.tabs.sendMessage(details.tabId, {type: 'likeBlocked'});
            return {cancel: true};
          }
        } else if (query.like_action && query.like_action === 'false') {
          if (currentLikes > 0) {
            currentLikes--;
          }
          storage.saveLikes(currentLikes, function (likes) {
            broadcastToFacebookTabs({
              type: 'updateLike', 
              likes: likes
            });
          });
        }
      }
    }, {urls: ['*://www.facebook.com/ajax/ufi/*']}, ['blocking', 'requestBody']);

})();
