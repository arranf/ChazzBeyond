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
          // And shows the extension's page action.
          actions: [new chrome.declarativeContent.ShowPageAction()]
        }
      ]);
    });
  });
}


function handleMessage(request, sender, sendResponse) {
  if (request.message == MESSAGE_NAME) {
    sendRoll(request.host, request.data);
  }
}

function sendRoll(host, data) {
  console.log(data);
  var xhr = new XMLHttpRequest();
  xhr.open('POST', host, true);
  xhr.setRequestHeader("Content-type", "application/json");
  xhr.send(JSON.stringify(data));
}

chrome.runtime.onMessage.addListener(handleMessage);
