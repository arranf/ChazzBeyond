const MESSAGE_NAME = 'postToChazz';
// TODO: https://www.npmjs.com/package/gulp-update-version
const VERSION = '0.4.1';

if (chrome.declarativeContent) {
    chrome.runtime.onInstalled.addListener(() => {
        //	 Replace all rules ...
        chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
            // With a new rule ...
            chrome.declarativeContent.onPageChanged.addRules([
                {
                    conditions: [
                        new chrome.declarativeContent.PageStateMatcher({
                            pageUrl: {
                                hostSuffix: '.dndbeyond.com',
                            },
                        }),
                    ],
                    // TODO: Make this work
                    // And shows the extension's page action.
                    actions: [new chrome.declarativeContent.ShowPageAction()],
                },
            ]);
        });
    });
}

function postToChazz(host, data) {
    // eslint-disable-next-line no-console
    console.debug('Sent to Chazz', data);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', host, true);
    xhr.setRequestHeader('Content-type', 'application/json');
    xhr.send(JSON.stringify({ ...data, version: VERSION }));
}

function handleMessage(request, _sender, _sendResponse) {
    if (request.message === MESSAGE_NAME) {
        postToChazz(request.host, request.data);
    }
}

chrome.runtime.onMessage.addListener(handleMessage);
