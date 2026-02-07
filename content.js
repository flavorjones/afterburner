function unlimitBoostInputs(root) {
  root.querySelectorAll('input[name="boost[content]"][maxlength]').forEach(input => {
    input.removeAttribute("maxlength")
  })
}

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
