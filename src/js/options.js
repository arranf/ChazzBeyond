// Saves options to chrome.storage
function save_options() {
  var options = document.getElementById('config').value;
  chrome.storage.local.set(JSON.parse(options), function () {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.hidden = false;
    setTimeout(function () {
      status.hidden = true;
    }, 3000);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  chrome.storage.local.get({
    user_id: '',
    guild_id: '',
    roll_endpoint: '',
  }, function (items) {
    document.getElementById('config').value = JSON.stringify(items);
  });
}
document.addEventListener('DOMContentLoaded', function () {
  restore_options();
  document.getElementById('save').addEventListener('click', save_options);
});
