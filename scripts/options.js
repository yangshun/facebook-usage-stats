jQuery(function ($) {
  function saveOptions () {
    var limit = parseInt($('#like-limit').val());
    if (isNaN(limit)) {
      $('#status').text('Please enter a non-negative integer.');
      setTimeout(function () {
        $('#status').text('');
      }, 3000);
    } else {
      chrome.storage.local.set({
        likesLimit: limit,
      }, function() {
        // Update status to let user know options were saved.
        $('#status').text('Saved.');
        setTimeout(function () {
          $('#status').text('').fadeOut();
        }, 3000);
      });
    }
  }

  function restoreOptions () {
    // Use default limit 10.
    chrome.storage.local.get({
      likesLimit: 10,
    }, function (items) {
      $('#like-limit').val(items.likesLimit);
    });
  }

  $('#save').click(saveOptions);
  restoreOptions();
});
