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
    getLikesLimit: function (callback) {
      chrome.storage.local.get({likesLimit: 10}, function (items) {
        console.log('Get Likes Limit: ', items.likesLimit);
        callback(items.likesLimit);
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

  storage.getLikesLimit(function (likesLimit) {
    LIKES_LIMIT = likesLimit;
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
          sendResponse({type: "updateLike", likes: likes});
        });
        // GOTCHA: since getLikes is asynchronous, return true to keep the channel open
        // so sendResponse can be called when getLike callback fires.
        // See: https://developer.chrome.com/extensions/runtime#method-sendMessage
        return true;
      } else if (message.type && message.type == 'requestLikesLimit') {
        storage.getLikesLimit(function (likesLimit) {
          sendResponse({type: "updateLikesLimit", likesLimit: likesLimit});
        });
        return true;
      }
  });

  chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
      if (details.requestBody && details.requestBody.raw) {
        var queryStr = arrayBufferToString(details.requestBody.raw[0].bytes);
        var query = URI.parseQuery(queryStr)
        if (query.like_action && query.like_action === 'true') {
          console.log(currentLikes + '/' + LIKES_LIMIT);
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


 chrome.storage.onChanged.addListener(function (changes, namespace) {
    for (key in changes) {
      var storageChange = changes[key];
      console.log('Storage key "%s" in namespace "%s" changed. ' +
                  'Old value was "%s", new value is "%s".',
                  key,
                  namespace,
                  storageChange.oldValue,
                  storageChange.newValue);
      // Update limit
      if (key == 'likesLimit') {
        LIKES_LIMIT = storageChange.newValue;
        broadcastToFacebookTabs({
          type: 'updateLikesLimit',
          likesLimit: storageChange.newValue
        });
      }
    }
  });
})();
