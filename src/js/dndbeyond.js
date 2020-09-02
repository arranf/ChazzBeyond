const MESSAGE_NAME = 'postToChazz';
console.log('ChazzBeyond is ready to rock and roll!')

const DND_BEYOND_OBSERVER = new MutationObserver(function mut(mutations, observer) {
    chrome.storage.local.get({
        roll_endpoint: '',
        user_id: '',
        guild_id: '',
        share_endpoint: ''
    }, function (configData) {
        if (!configData.roll_endpoint) {
            // TODO: offer a floating pop up to configure
            return
        }

        for (let i = 0; i < mutations.length; i++) {
            const mutation = mutations[i];
            for (let m = 0; m < mutation.addedNodes.length; m++) {
                const addedNode = mutation.addedNodes[m];
                if (addedNode.nodeType !== Node.ELEMENT_NODE) {
                    continue;
                }

                // Handle dice results
                let diceResultsElements = addedNode.getElementsByClassName('dice_result');
                if (diceResultsElements.length > 0) {
                    handleNormalRolls(diceResultsElements, configData);
                    console.groupEnd();
                    return;
                }

                // Handle spells sharing
                handleSpellAndActionSharing(addedNode, configData);
            }
        }
    });
});

function handleNormalRolls(results, configData) {
    const characterName = document.getElementsByClassName('ddbc-character-name')[0].textContent;
    const latestRoll = results[results.length - 1];
    const rollTitle = latestRoll.getElementsByClassName('dice_result__info__rolldetail')[0].textContent.split(':')[0];
    const rollNotation = latestRoll.getElementsByClassName('dice_result__info__dicenotation')[0].textContent;
    const rollBreakdown = latestRoll.getElementsByClassName('dice_result__info__breakdown')[0].textContent;
    const rollTotal = latestRoll.getElementsByClassName('dice_result__total-result')[0].textContent;
    const rollType = latestRoll.getElementsByClassName('dice_result__rolltype')[0].textContent;
    const rollHeader = latestRoll.getElementsByClassName('dice_result__total-header');
    if (rollHeader.length > 0) {
        rollTitle += ` (${rollHeader[0].textContent})`;
    }

    let rolljson = {
        character: characterName,
        roll: {
            'formula': rollNotation,
            'result': Number(rollTotal),
            'breakdown': rollBreakdown,
            'source': rollTitle,
            'type': '',
        },
        color: '',
        user_id: configData.user_id
    };

    // TODO: Refactor this condition logic for roll type
    if (['check', 'save', 'attack', 'damage'].includes(rollType)) {
        rolljson.roll.type = rollType;
    } else if (rollType == 'to hit') {
        rolljson.roll.type = 'attack';
        if (document.getElementsByClassName('ddbc-combat-attack--crit').length > 0) {
            rolljson.roll.source += ' (CRIT)';
        }
    }

    const dicetoolbar = document.getElementsByClassName('dice-toolbar')[0];
    if (dicetoolbar) {
        const color = window.getComputedStyle(dicetoolbar).backgroundColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (color) {
            const colorHex = '#' + ('0' + parseInt(color[1]).toString(16)).slice(-2) + ('0' + parseInt(color[2]).toString(16)).slice(-2) + ('0' + parseInt(color[3]).toString(16)).slice(-2);
            rolljson.color = colorHex;
        }
    }

    chrome.runtime.sendMessage({
        'message': MESSAGE_NAME,
        'host': configData.roll_endpoint,
        'data': rolljson,
    });
}

function handleSpellAndActionSharing(addedNode, configData) {
    const spellDetailDescriptionElements = addedNode.getElementsByClassName('ct-spell-detail__description');
    let detailNode = spellDetailDescriptionElements[0];
    let actionType = 'spell';
    let actionName = '';

    // TODO MAKE THIS SAFE
    if (detailNode) {
        actionName = addedNode.getElementsByClassName('ddbc-spell-name')[0].textContent;
    } else {
        const results = addedNode.getElementsByClassName('ct-action-detail__description');
        detailNode = results[0];
        if (detailNode) {
            actionType = 'action';
            actionName = addedNode.getElementsByClassName('ddbc-action-name')[0].textContent;
        }
    }

    // If we didn't find a description - we're done.
    if (!detailNode) {
        return;
    }


    const characterName = document.getElementsByClassName('ddbc-character-name')[0].textContent;
    const dicetoolbar = document.getElementsByClassName('dice-toolbar')[0];

    let colorHex = '';
    if (dicetoolbar) {
        const color = window.getComputedStyle(dicetoolbar).backgroundColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (color) {
            colorHex = '#' + ('0' + parseInt(color[1]).toString(16)).slice(-2) + ('0' + parseInt(color[2]).toString(16)).slice(-2) + ('0' + parseInt(color[3]).toString(16)).slice(-2);
        }
    }

    const json = {
        character: characterName,
        user_id: configData.user_id,
        color: colorHex,
        action: {
            actionType,
            actionName,
            content: detailNode.innerHTML
        },
    };


    const sendToChazzButton = document.getElementById('sendToChazz');
    if (sendToChazzButton) {
        sendToChazzButton.removeEventListener('click');
        sendToChazzButton.addEventListener('click', function () {
            chrome.runtime.sendMessage({
                'message': MESSAGE_NAME,
                'host': configData.share_endpoint,
                'data': json
            });
        });
    } else {
        let { sendToButton, sendToDiv } = createShareButton();
        sendToButton.addEventListener('click', function () {
            chrome.runtime.sendMessage({
                'message': MESSAGE_NAME,
                'host': configData.share_endpoint,
                'data': json
            });
        });
        detailNode.appendChild(sendToDiv);
        sendToDiv.appendChild(sendToButton);
    }

}

function createShareButton() {
    let sendToDiv = document.createElement('div');
    sendToDiv.style.textAlign = 'right';
    sendToDiv.style.marginTop = 10;
    let sendToButton = document.createElement('button');
    sendToButton.id = 'sendToChazz';
    sendToButton.classList.add('ct-theme-button', 'ct-theme-button--filled', 'ct-theme-button--interactive', 'ct-button', 'character-button');
    sendToButton.innerText = 'Share using Chazz';
    sendToButton.style.textAlign = 'right';

    return { sendToButton, sendToDiv };
}

DND_BEYOND_OBSERVER.observe(document, { childList: true, subtree: true })