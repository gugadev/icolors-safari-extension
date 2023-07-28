let defaultColor = "#000000"
let storageKey = "iColors"

async function getStoredColor() {
    const storageObject = await browser.storage.local.get(storageKey)
    const { color } = storageObject[storageKey] || {}
    return color || defaultColor
}

const input = document.getElementById("colorPicker")
const applyBtn = document.getElementById("actionBtn")

applyBtn.addEventListener("click", () => {
    setColor(input.value)
})

async function setColor(color) {
    const tabs = await browser.tabs.query({})
    console.log(`[iColors#popup.js] Gonna apply theme ${color} to ${tabs.length} tabs`)
    const requests = tabs.map((tab) => {
        return browser.tabs.sendMessage(tab.id, {
            changeColor: true,
            color,
        })
    })
    await Promise.allSettled(requests)
}

(async () => {
    const color = await getStoredColor()
    console.log("[iColors#popup.js] stored color:", color)
    input.value = color
})()
