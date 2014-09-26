jQuery(function ($) {
  function save_options () {
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

  function restore_options () {
    // Use default limit 10.
    chrome.storage.local.get({
      likesLimit: 10,
    }, function (items) {
      $('#like-limit').val(items.likesLimit);
    });
  }

  $('#save').click(save_options);
  restore_options();
})
