const SELECTOR = 'input[name="boost[content]"][maxlength]'

function unlimitBoostInputs(root) {
  if (root.matches && root.matches(SELECTOR)) {
    root.removeAttribute("maxlength")
  }
  root.querySelectorAll(SELECTOR).forEach(input => {
    input.removeAttribute("maxlength")
  })
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
  }).observe(document.body, { childList: true, subtree: true })
}

if (typeof module !== "undefined") {
  module.exports = { unlimitBoostInputs, observeBoostInputs }
} else {
  observeBoostInputs()
}
