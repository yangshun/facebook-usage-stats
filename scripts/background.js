(function() {


// Encoding API not available in chrome 37 and below
// Using http://updates.html5rocks.com/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
// with UTF8
function arrayBufferToString(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

var currentDate = new Date().toLocaleDateString('en-US');

var storage = {
  getLikes: function (callback) {
    chrome.storage.local.get(currentDate + '-likes', function(items) {
      console.log("Get Likes: ", items[currentDate + '-likes']);
      if (items[currentDate + '-likes']) {
        callback(items[currentDate + '-likes']);
      } else {
        callback(0);
      }
    });
  },
  saveLikes: function (likes, callback) {
    var value = {};
    value[currentDate + '-likes'] = likes;
    chrome.storage.local.set(value, function() {
      console.log("Save Likes: ", likes);
      callback(likes);
    })
  },
};

var LIKES_LIMIT = 10;
var currentLikes = 0;
storage.getLikes(function(likes) {
  currentLikes = likes;
});

function broadcastToFacebookTabs(msg) {
  chrome.tabs.query({url: "*://*.facebook.com/*"}, function(tabs) {
    for (var i = 0; i < tabs.length; i++) {
      chrome.tabs.sendMessage(tabs[i].id, msg);
    };
  })
}

console.log("alive");
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    if (details.requestBody && details.requestBody.raw) {
      var queryStr = arrayBufferToString(details.requestBody.raw[0].bytes);
      var query = URI.parseQuery(queryStr)
      if (query.like_action && query.like_action === "true") {
        if (currentLikes < LIKES_LIMIT) {
          currentLikes++;
          storage.saveLikes(currentLikes, function(likes) {
            broadcastToFacebookTabs({type: "updateLike"});
          });
        } else {
          chrome.tabs.sendMessage(details.tabId, {type: "likeBlocked"});
          return {cancel: true}
        }
      } else if (query.like_action && query.like_action === "false") {
        if (currentLikes > 0) currentLikes--;
        storage.saveLikes(currentLikes, function(likes) {
          broadcastToFacebookTabs({type: "updateLike"});
        });
      }
    }
  }, {urls: ["*://www.facebook.com/ajax/ufi/*"]}, ["blocking", "requestBody"]);

})();