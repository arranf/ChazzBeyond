/* eslint-disable radix */
const MESSAGE_NAME = 'postToChazz';

// eslint-disable-next-line no-console
console.debug("Chazz Beyond running. Let's Chazz it up!");

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
    const red = `${`0${parseInt(color[1]).toString(16)}`.slice(-2)}`;
    const blue = `${`0${parseInt(color[2]).toString(16)}`.slice(-2)}`;
    const green = `${`0${parseInt(color[3]).toString(16)}`.slice(-2)}`;
    return `#${red}${blue}${green}`;
}

// Handles dice being rolled
function handleNormalRolls(results, configData) {
    let characterName = '';
    const characterNameNode = document.getElementsByClassName(
        'ddbc-character-name'
    )[0];
    if (characterNameNode) {
        characterName = characterNameNode.textContent;
    } else if (window.location.toString().indexOf('characters') !== -1) {
        characterName = 'Unknown';
    } else {
        // We know the user is a DM or rolling on items/monsters
        characterName = undefined;
    }
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
    } else if (source === 'HP') {
        rollType = 'hitpoints';
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
            // Potentially sensitive rolls
            // 'recharge',
            // 'hitpoints',
        ].includes(rollType)
    ) {
        rollType = '';
    } else if (rollType === 'recharge') {
        rollType = `${source} recharge`;
        source = rollType;
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

// Gets the list of properties (casting time, components, etc.)
function getSpellActionProperties(node, actionType) {
    const nodeResults = node.getElementsByClassName('ddbc-property-list');
    const propertyContainerNode = nodeResults[0];
    if (!propertyContainerNode) {
        return [];
    }
    const children = propertyContainerNode.childNodes;

    const properties = [];
    for (let i = 0; i < children.length; i++) {
        const propertyChildNode = children[i];
        const label = propertyChildNode.getElementsByClassName(
            'ddbc-property-list__property-label'
        )[0].innerText;
        const content = propertyChildNode.getElementsByClassName(
            'ddbc-property-list__property-content'
        )[0].innerText;
        properties.push({ label, content });
    }
    if (actionType === 'spell') {
        const items = document.getElementsByClassName(
            'ct-spell-detail__level-school-item'
        );
        properties.push({ label: 'School', content: items[0].innerText });
        properties.push({ label: 'Level', content: items[1].innerText });
    }

    return properties;
}

// Handles spell panes
function getSpellDetails(addedNode) {
    const spellDetailDescriptionElements = addedNode.getElementsByClassName(
        'ct-spell-detail__description'
    );
    const detailNode = spellDetailDescriptionElements[0];
    if (!detailNode) {
        return undefined;
    }
    const spellNameNode = addedNode.getElementsByClassName(
        'ddbc-spell-name'
    )[0];
    let actionName;
    if (spellNameNode) {
        actionName = spellNameNode.textContent;
    } else {
        const sidebar = document.getElementsByClassName(
            'ct-sidebar__heading'
        )[0];
        actionName = sidebar.getElementsByClassName('ddbc-spell-name')[0]
            .textContent;
    }
    return {
        actionType: 'spell',
        actionName,
        detailNode,
    };
}

// Handles action panes
function getActionDetails(addedNode) {
    const results = addedNode.getElementsByClassName(
        'ct-action-detail__description'
    );
    const detailNode = results[0];
    if (!detailNode) {
        return undefined;
    }
    const actionNameNode = addedNode.getElementsByClassName(
        'ddbc-action-name'
    )[0];
    let actionName;
    if (actionNameNode) {
        actionName = actionNameNode.textContent;
    } else {
        const sidebar = document.getElementsByClassName(
            'ct-sidebar__heading'
        )[0];
        actionName = sidebar.getElementsByClassName('ddbc-action-name')[0]
            .textContent;
    }
    return { actionType: 'action', actionName, detailNode };
}

// Handles racial, feat, and class features panes
function getFeatureDetails(addedNode) {
    let sidebarHeader = addedNode.getElementsByClassName(
        'ct-sidebar__header-parent'
    )[0];
    if (!sidebarHeader) {
        sidebarHeader = addedNode.getElementsByClassName(
            'ct-sidebar__header-primary'
        )[0];
    }

    if (!sidebarHeader) {
        return undefined;
    }
    let paneNode = document.getElementsByClassName('ct-class-feature-pane')[0];
    if (!paneNode) {
        paneNode = document.getElementsByClassName('ct-racial-trait-pane')[0];
    }
    if (!paneNode) {
        paneNode = document.getElementsByClassName('ct-feat-pane')[0];
    }

    if (!paneNode) {
        return undefined;
    }
    const actionName = document.getElementsByClassName('ct-sidebar__heading')[0]
        .textContent;
    const detailNode = paneNode.getElementsByClassName('ct-feature-snippet')[0];
    return { actionType: 'feature', actionName, detailNode, paneNode };
}

function handleSnippetSharing(addedNode, configData) {
    let result;
    [getSpellDetails, getActionDetails, getFeatureDetails].some(
        // eslint-disable-next-line no-return-assign
        (fn) => (result = fn(addedNode))
    );
    // If we didn't find a description - we're done.
    if (!result) {
        return;
    }

    const { actionName, actionType, detailNode, paneNode } = result;

    const properties = getSpellActionProperties(addedNode, actionType);

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
        properties,
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
        const rootNode = paneNode || detailNode;
        const { sendToButton, sendToDiv } = createShareButton();
        sendToButton.addEventListener('click', () => {
            chrome.runtime.sendMessage({
                message: MESSAGE_NAME,
                host: configData.share_endpoint,
                data: json,
            });
        });
        rootNode.appendChild(sendToDiv);
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

                        if (
                            window.location.toString().indexOf('characters') !==
                            -1
                        ) {
                            // Handle spells sharing
                            handleSnippetSharing(addedNode, configData);
                        }
                    }
                }
            }
        }
    );
});

DND_BEYOND_OBSERVER.observe(document.body, {
    childList: true,
    subtree: true,
});
