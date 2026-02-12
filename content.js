const SELECTOR = 'input[name="boost[content]"][maxlength]'
const WARN_THRESHOLD = 16
const DANGER_THRESHOLD = 32
const BORDER_STYLE = "3px solid"

function unlimitBoostInputs(root) {
  if (root.matches && root.matches(SELECTOR)) {
    unlimitInput(root)
  }
  root.querySelectorAll(SELECTOR).forEach(unlimitInput)
}

function unlimitInput(input) {
  input.removeAttribute("maxlength")
  input.addEventListener("input", updateBorder)
}

function updateBorder(event) {
  const form = event.target.closest("form")
  if (!form) return

  const length = event.target.value.length
  if (length > DANGER_THRESHOLD) {
    form.style.border = `${BORDER_STYLE} red`
  } else if (length > WARN_THRESHOLD) {
    form.style.border = `${BORDER_STYLE} gold`
  } else {
    form.style.border = ""
  }
}

function observeBoostInputs() {
  unlimitBoostInputs(document)

  new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          unlimitBoostInputs(node)
        }
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true })
}

if (typeof module !== "undefined") {
  module.exports = { unlimitBoostInputs, updateBorder, observeBoostInputs }
} else {
  observeBoostInputs()
}
