// Saves options to chrome.storage
function saveOptions() {
    const options = document.getElementById('config').value
    chrome.storage.local.set(JSON.parse(options), () => {
        // Update status to let user know options were saved.
        const status = document.getElementById('status')
        status.hidden = false
        setTimeout(() => {
            status.hidden = true
        }, 3000)
    })
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
    chrome.storage.local.get(
        {
            user_id: '',
            guild_id: '',
            roll_endpoint: '',
            share_endpoint: '',
        },
        (items) => {
            document.getElementById('config').value = JSON.stringify(items)
        }
    )
}
document.addEventListener('DOMContentLoaded', () => {
    restoreOptions()
    document.getElementById('save').addEventListener('click', saveOptions)
})
