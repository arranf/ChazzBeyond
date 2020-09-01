const MESSAGE_NAME = 'postToChazz';
console.log('ChazzBeyond is ready to rock and roll!')
const DND_BEYOND_OBSERVER = new MutationObserver(function mut(mutations, observer) {
    chrome.storage.local.get({
        roll_endpoint: '',
        user_id: '',
        guild_id: ''
    }, function (configData) {
        if (!configData.roll_endpoint.startsWith('http')) {
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
                let results = addedNode.getElementsByClassName('dice_result');
                if (results.length > 0) {
                    handleNormalRolls(results, configData);
                }

                // Handle spells sharing
                results = addedNode.getElementsByClassName('ct-spell-detail__description');

                // TODO: Reenable
                // handleSpellAndActionSharing(results, mutation, configData);
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
    const rollHeader = latestRoll.getElementsByClassName("dice_result__total-header");
    if (rollHeader.length > 0) {
        rollTitle += ` (${rollHeader[0].textContent})`;
    }

    let rolljson = {
        character: characterName,
        roll: {
            "formula": rollNotation,
            "result": Number(rollTotal),
            "breakdown": rollBreakdown,
            "source": rollTitle,
            "type": '',
        },
        color: '',
        user_id: configData.user_id
    };

    // TODO: Refactor this condition logic for roll type
    if (["check", "save", "attack", "damage"].includes(rollType)) {
        rolljson.roll.type = rollType;
    } else if (rollType == "to hit") {
        rolljson.roll.type = "attack";
        if (document.getElementsByClassName('ddbc-combat-attack--crit').length > 0) {
            rolljson.roll.source += " (CRIT)";
        }
    }

    const dicetoolbar = document.getElementsByClassName('dice-toolbar')[0];
    if (dicetoolbar) {
        const color = window.getComputedStyle(dicetoolbar).backgroundColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (color) {
            const colorHex = "#" + ("0" + parseInt(color[1]).toString(16)).slice(-2) + ("0" + parseInt(color[2]).toString(16)).slice(-2) + ("0" + parseInt(color[3]).toString(16)).slice(-2);
            rolljson.color = colorHex;
        }
    }

    chrome.runtime.sendMessage({
        "message": MESSAGE_NAME,
        "host": configData.roll_endpoint,
        "data": rolljson,
    });
}

function handleSpellAndActionSharing(results, addedNode, configData) {
    let actiontype = "spell";
    let actionname = ""
    if (results[0]) {
        actionname = addedNode.getElementsByClassName('ddbc-spell-name')[0].textContent;
    } else {
        results = addedNode.getElementsByClassName('ct-action-detail__description');
        if (results[0]) {
            actiontype = "action";
            actionname = addedNode.getElementsByClassName('ddbc-action-name')[0].textContent;
        }
    }

    if (results.length <= 0 || document.getElementById('sendToChazz')) {
        return;
    }

    let { sendToButton, sendToDiv } = createShareButton();

    const characterName = document.getElementsByClassName('ddbc-character-name')[0].textContent;
    let json = {
        "source": characterName + " shared the " + actiontype + ": \"" + actionname + "\"",
        "type": "chat",
        "content": results[0].innerText
    };

    const dicetoolbar = document.getElementsByClassName('dice-toolbar')[0];

    if (dicetoolbar) {
        let color = window.getComputedStyle(dicetoolbar).backgroundColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (color) {
            let colorHex = "#" + ("0" + parseInt(color[1]).toString(16)).slice(-2) + ("0" + parseInt(color[2]).toString(16)).slice(-2) + ("0" + parseInt(color[3]).toString(16)).slice(-2);
            json.color = colorHex;
        }
    }

    sendToButton.addEventListener('click', function () {
        chrome.runtime.sendMessage({
            "message": MESSAGE_NAME,
            "host": configData.roll_endpoint,
            "data": json
        });
    });
    results[0].appendChild(sendToDiv);
    sendToDiv.appendChild(sendtoEButton);
}

function createShareButton() {
    let sendToDiv = document.createElement("div");
    sendToDiv.style.textAlign = "right";
    sendToDiv.style.marginTop = 10;
    let sendToButton = document.createElement("button");
    sendToButton.id = 'sendToChazz';
    sendToButton.classList.add('ct-theme-button', 'ct-theme-button--filled', 'ct-theme-button--interactive', 'ct-button', 'character-button');
    sendToButton.innerText = 'Share using Chazz';
    sendToButton.style.textAlign = "right";

    return { sendToButton, sendToDiv };
}


DND_BEYOND_OBSERVER.observe(document, { childList: true, subtree: true })
