/* eslint-disable radix */
const MESSAGE_NAME = 'postToChazz';

// Turns a shorthand attribute into a longhand attribute e.g. 'cha' -> 'Charisma'
function getFullAttribute(attributeShorthand) {
    switch (attributeShorthand) {
        case 'cha':
            return 'Charisma';
        case 'int':
            return 'Intellect';
        case 'wis':
            return 'Wisdom';
        case 'dex':
            return 'Dexterity';
        case 'str':
            return 'Strength';
        case 'con':
            return 'Constitution';
        default:
            throw new Error(`No matching longhand for ${attributeShorthand}`);
    }
}

// From a RGB array return the hex representation
function getHex(color) {
    return `#0${parseInt(color[1]).toString(16).slice(-2)}0${parseInt(color[2])
        .toString(16)
        .slice(-2)}0${parseInt(color[3]).toString(16).slice(-2)}`;
}

function handleNormalRolls(results, configData) {
    const characterName = document.getElementsByClassName(
        'ddbc-character-name'
    )[0].textContent;
    const latestRoll = results[results.length - 1];
    const rollNotation = latestRoll.getElementsByClassName(
        'dice_result__info__dicenotation'
    )[0].textContent;
    const rollBreakdown = latestRoll.getElementsByClassName(
        'dice_result__info__breakdown'
    )[0].textContent;
    const rollTotal = latestRoll.getElementsByClassName(
        'dice_result__total-result'
    )[0].textContent;
    const rollHeader = latestRoll.getElementsByClassName(
        'dice_result__total-header'
    );
    let rollType = latestRoll.getElementsByClassName('dice_result__rolltype')[0]
        .textContent;
    let source = latestRoll
        .getElementsByClassName('dice_result__info__rolldetail')[0]
        .textContent.split(':')[0];

    // Cleanup this business logic into smaller chunks
    let rollTypePrefix = '';
    if (['cha', 'str', 'wis', 'int', 'dex', 'con'].includes(source)) {
        source = getFullAttribute(source);
        rollTypePrefix = source;
    } else if (source === 'Initiative') {
        rollType = 'initiative';
    }

    if (rollHeader.length > 0) {
        source += ` (${rollHeader[0].textContent})`;
    }

    // Ignore non-whitelisted roll types
    if (
        ![
            'check',
            'save',
            'attack',
            'damage',
            'to hit',
            'heal',
            'initiative',
        ].includes(rollType)
    ) {
        rollType = '';
    } else if (rollType === 'to hit') {
        if (
            document.getElementsByClassName('ddbc-combat-attack--crit').length >
            0
        ) {
            rollType += ' (CRIT)';
        }
    } else if (rollType === 'check' || rollType === 'save') {
        rollType = rollTypePrefix
            ? `${rollTypePrefix.toLowerCase()} ${rollType}`
            : `${source} ${rollType}`;
    }

    const rollJSON = {
        character: characterName,
        roll: {
            formula: rollNotation,
            result: Number(rollTotal),
            breakdown: rollBreakdown,
            source,
            type: rollType,
        },
        color: '',
        user_id: configData.user_id,
    };

    const dicetoolbar = document.getElementsByClassName('dice-toolbar')[0];
    if (dicetoolbar) {
        const color = window
            .getComputedStyle(dicetoolbar)
            .backgroundColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (color) {
            rollJSON.color = getHex(color);
        }
    }

    chrome.runtime.sendMessage({
        message: MESSAGE_NAME,
        host: configData.roll_endpoint,
        data: rollJSON,
    });
}

function createShareButton() {
    const sendToDiv = document.createElement('div');
    sendToDiv.style.textAlign = 'right';
    sendToDiv.style.marginTop = 10;
    const sendToButton = document.createElement('button');
    sendToButton.id = 'sendToChazz';
    sendToButton.classList.add(
        'ct-theme-button',
        'ct-theme-button--filled',
        'ct-theme-button--interactive',
        'ct-button',
        'character-button'
    );
    sendToButton.innerText = 'Share using Chazz';
    sendToButton.style.textAlign = 'right';

    return { sendToButton, sendToDiv };
}

function handleSpellAndActionSharing(addedNode, configData) {
    const spellDetailDescriptionElements = addedNode.getElementsByClassName(
        'ct-spell-detail__description'
    );
    let detailNode = spellDetailDescriptionElements[0];
    let actionType = 'spell';
    let actionName = '';

    if (detailNode) {
        const spellNameNode = addedNode.getElementsByClassName(
            'ddbc-spell-name'
        )[0];
        if (spellNameNode) {
            actionName = spellNameNode.textContent;
        } else {
            const sidebar = document.getElementsByClassName(
                'ct-sidebar__heading'
            )[0];
            actionName = sidebar.getElementsByClassName('ddbc-spell-name')[0]
                .textContent;
        }
    } else {
        const results = addedNode.getElementsByClassName(
            'ct-action-detail__description'
        );
        detailNode = results[0];
        if (detailNode) {
            actionType = 'action';
            const actionNameNode = addedNode.getElementsByClassName(
                'ddbc-action-name'
            )[0];
            if (actionNameNode) {
                actionName = actionNameNode.textContent;
            } else {
                const sidebar = document.getElementsByClassName(
                    'ct-sidebar__heading'
                )[0];
                actionName = sidebar.getElementsByClassName(
                    'ddbc-action-name'
                )[0].textContent;
            }
        }
    }

    // If we didn't find a description - we're done.
    if (!detailNode) {
        return;
    }

    const characterName = document.getElementsByClassName(
        'ddbc-character-name'
    )[0].textContent;
    const dicetoolbar = document.getElementsByClassName('dice-toolbar')[0];

    let colorHex = '';
    if (dicetoolbar) {
        const color = window
            .getComputedStyle(dicetoolbar)
            .backgroundColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (color) {
            colorHex = getHex(color);
        }
    }

    const json = {
        character: characterName,
        user_id: configData.user_id,
        color: colorHex,
        action: {
            actionType,
            actionName,
            content: detailNode.innerHTML,
        },
    };

    const sendToChazzButton = document.getElementById('sendToChazz');
    if (sendToChazzButton) {
        sendToChazzButton.removeEventListener('click');
        sendToChazzButton.addEventListener('click', () => {
            chrome.runtime.sendMessage({
                message: MESSAGE_NAME,
                host: configData.share_endpoint,
                data: json,
            });
        });
    } else {
        const { sendToButton, sendToDiv } = createShareButton();
        sendToButton.addEventListener('click', () => {
            chrome.runtime.sendMessage({
                message: MESSAGE_NAME,
                host: configData.share_endpoint,
                data: json,
            });
        });
        detailNode.appendChild(sendToDiv);
        sendToDiv.appendChild(sendToButton);
    }
}

const DND_BEYOND_OBSERVER = new MutationObserver(function mut(
    mutations,
    _observer
) {
    chrome.storage.local.get(
        {
            roll_endpoint: '',
            user_id: '',
            guild_id: '',
            share_endpoint: '',
        },
        (configData) => {
            if (!configData.roll_endpoint) {
                // TODO: offer a floating pop up to configure
                return;
            }

            for (let i = 0; i < mutations.length; i++) {
                const mutation = mutations[i];
                for (let m = 0; m < mutation.addedNodes.length; m++) {
                    const addedNode = mutation.addedNodes[m];
                    if (addedNode.nodeType === Node.ELEMENT_NODE) {
                        // Handle dice results
                        const diceResultsElements = addedNode.getElementsByClassName(
                            'dice_result'
                        );
                        if (diceResultsElements.length > 0) {
                            handleNormalRolls(diceResultsElements, configData);
                            return;
                        }

                        // Handle spells sharing
                        handleSpellAndActionSharing(addedNode, configData);
                    }
                }
            }
        }
    );
});

DND_BEYOND_OBSERVER.observe(document, { childList: true, subtree: true });
