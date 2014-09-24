(function() {


// Encoding API not available in chrome 37 and below
// Using http://updates.html5rocks.com/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
// with UTF8
function arrayBufferToString(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}


function messageFacebookTabs(msg) {
  chrome.tabs.query({url: "*://*.facebook.com/*"}, function(tabs) {
    for (var i = 0; i < tabs.length; i++) {
      console.log(tabs[i], msg);
      chrome.tabs.sendMessage(tabs[i].id, msg);
    };
  })
}

console.log("alive");
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    console.log(details);
    if (details.requestBody && details.requestBody.raw) {
      var queryStr = arrayBufferToString(details.requestBody.raw[0].bytes);
      var query = URI.parseQuery(queryStr)
      if (query.like_action && query.like_action === "true") {
        messageFacebookTabs({msg:"A like was made"});
      } else if (query.like_action && query.like_action === "false") {
        messageFacebookTabs({msg:"An unlike was made"});
      }
    }
  }, {urls: ["*://www.facebook.com/ajax/ufi/*"]}, ["blocking", "requestBody"]);

})();