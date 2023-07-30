/**
 * @author Gustavo Garcia (gugadev)
 * @description this file is triggered when the extension runs.
 */

let defaultColor = "#000000"
let storageKey = "iColors"

const observers = []

function removeObservers() {
    console.log("[iColors] disconnecting observers", observers)
    observers.forEach(observer => {
        observer.disconnect()
    })
}

async function saveColor(color) {
    await browser.storage.local.set({ [storageKey]: color })
    console.log(`[iColors#content.js] Color "${color}" saved`)
}

async function getStoredColor() {
    const storageObject = await browser.storage.local.get(storageKey)
    const { color } = storageObject[storageKey] || {}
    return color || defaultColor
}

/**
 * @description Observes for our meta tag changes in content (color).
 * I didn't see this behaviour yet, but there it is if we need it.
 */
const observeMeta = (meta, color) => {
    const observer = new MutationObserver((list, obs) => {
        for (const mutation of list) {
            if (mutation.type === "attributes") {
                if (mutation.attributeName === "content") {
                    console.log(`[iColors#content.js] Attribute "content" changed.`, mutation)
                    if (mutation.oldValue === color) {
                        meta.setAttribute("content", color)
                    }
                }
            }
        }
    })
    observers.push(observer)
    observer.observe(meta, { attributes: true, attributeOldValue: true })
    console.log("[iColors#content.js] Observing meta theme color tag...")
}

/**
 * @description Watch for new added nodes to the head.
 * If a new theme-color is added will overwrite
 * our theme-color tag. So, if we detect any new,
 * we gonna remove it.
 */
const observeForAddings = () => {
    const observer = new MutationObserver((list, obs) => {
        for (const mutation of list) {
            if (mutation.addedNodes) {
                const metaThemeTags = Array.from(mutation.addedNodes).filter(node => {
                    const isElement = node instanceof HTMLElement
                    if (!isElement) { return false }
                    const isMeta = node.tagName.toLowerCase() === "meta"
                    const isTheme = node.getAttribute("name")?.toLowerCase() === "theme-color"
                    return isMeta && isTheme && node.id !== "icolors"
                });
                try {
                    metaThemeTags.forEach(node => {
                        console.log("[iColors#content.js] default theme tag found. Removing it.", node)
                        document.head.removeChild(node)
                    })
                } catch {}
            }
        }
    })
    observers.push(observer)
    observer.observe(document.head, { childList: true })
    console.log("[iColors#content.js] Observing for meta tags addings...")
}

/**
 * @description Creates a new meta theme tag
 */
function createMeta(color) {
    const meta = document.createElement("meta")
    meta.id = "icolors"
    meta.setAttribute("name", "theme-color")
    meta.setAttribute("content", color)
    console.log("[iColors#content.js] New meta created:", meta)
    return meta
}

function start (color) {
    if (color) {
        const themeColors = document.querySelectorAll("[name='theme-color']")
        if (themeColors.length > 0) {
            console.log("[iColors#content.js] Removing existent theme-colors...", themeColors)
            try {
                Array.from(themeColors).forEach(node => {
                    node.id = 'icolors'
                    node.setAttribute('content', color)
                    observeMeta(node)
                })
            } catch {}
            observeForAddings()
        }
        console.log("[iColors#content.js] Creating a new theme...")
        const meta = createMeta(color)
        document.head.appendChild(meta)
        observeMeta(meta, color)
    }
}

/**
 * @description this function set the new theme
 * and stores it into the local storage.
 */
async function changeColor(color) {
    try {
        console.log(`[iColors#content.js] Setting color: ${color}`)
        await saveColor({ color })
        start(color)
    } catch (e) {
        console.warn("[iColors#content.js] Something went wrong:", e)
    }
    
}

/**
 * TODO: remove because this didn't work
 */
window.onbeforeunload = () => {
    removeObservers()
}

/**
 * @description here we initially retrieve the stored theme
 */
(async () => {
    const color = await getStoredColor()
    console.log("[iColors#content.js] Stored color:", color)
    start(color)
})()

/**
 * @description here we listen for popup.js messages
 */
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("[iColors#content.js] Received request: ", request);
    if (request.changeColor) {
        changeColor(request.color)
    }
});
