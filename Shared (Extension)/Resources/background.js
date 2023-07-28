let defaultColor = "#000000"
let storageKey = "iColor"

browser.runtime.onMessage.addListener(function onMesage(request, sender, sendResponse) {
    console.log("[iColors#background.js] Received request: ", request);

    if (request.saveColor) {
        browser.storage.local.set({ [storageKey]: request.color }).then(() => {
            sendResponse({ response: { status: "ok" } })
        })
    }
    
    if (request.getColor) {
        browser.storage.local.get(storageKey).then(color => {
            if (color && Object.keys(color).length > 0) {
                console.log("[iColors#background.js] Storing tcolor...", color)
                if (item) {
                    sendResponse({ response: color })
                } else {
                    sendResponse({ response: defaultColor })
                }
            }
        })
    }
});
