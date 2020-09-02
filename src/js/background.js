const MESSAGE_NAME = 'postToChazz';

if (chrome.declarativeContent) {
  chrome.runtime.onInstalled.addListener(function () {
    //	 Replace all rules ...
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
      // With a new rule ...
      chrome.declarativeContent.onPageChanged.addRules([
        {
          conditions: [
            new chrome.declarativeContent.PageStateMatcher({
              pageUrl: {
                hostSuffix: '.dndbeyond.com',
                pathContains: '/characters/',
                pathPrefix: '/profile/'
              },
            })
          ],
          // TODO: Make this work
          // And shows the extension's page action.
          actions: [new chrome.declarativeContent.ShowPageAction()]
        }
      ]);
    });
  });
}


function handleMessage(request, _sender, _sendResponse) {
  if (request.message == MESSAGE_NAME) {
    postToChazz(request.host, request.data);
  }
}

function postToChazz(host, data) {
  console.debug('Sent to Chazz', data);
  var xhr = new XMLHttpRequest();
  xhr.open('POST', host, true);
  xhr.setRequestHeader("Content-type", "application/json");
  xhr.send(JSON.stringify(data));
}

chrome.runtime.onMessage.addListener(handleMessage);
