const { JSDOM } = require("jsdom")
const assert = require("node:assert/strict")
const { describe, it, beforeEach } = require("node:test")

const { unlimitBoostInputs, updateBorder, observeBoostInputs } = require("./content")

function boostInput(maxlength = "16") {
  const input = document.createElement("input")
  input.setAttribute("name", "boost[content]")
  if (maxlength) input.setAttribute("maxlength", maxlength)
  return input
}

function otherInput(maxlength = "255") {
  const input = document.createElement("input")
  input.setAttribute("name", "message[body]")
  if (maxlength) input.setAttribute("maxlength", maxlength)
  return input
}

function typeInto(input, text) {
  input.value = text
  input.dispatchEvent(new dom.window.Event("input", { bubbles: true }))
}

let dom

beforeEach(() => {
  dom = new JSDOM("<!DOCTYPE html><html><body></body></html>")
  global.document = dom.window.document
  global.Node = dom.window.Node
  global.MutationObserver = dom.window.MutationObserver
  global.getComputedStyle = dom.window.getComputedStyle
})

describe("unlimitBoostInputs", () => {
  it("removes maxlength from boost inputs", () => {
    const input = boostInput()
    document.body.appendChild(input)

    unlimitBoostInputs(document)

    assert.equal(input.hasAttribute("maxlength"), false)
  })

  it("handles multiple boost inputs", () => {
    const input1 = boostInput()
    const input2 = boostInput()
    document.body.appendChild(input1)
    document.body.appendChild(input2)

    unlimitBoostInputs(document)

    assert.equal(input1.hasAttribute("maxlength"), false)
    assert.equal(input2.hasAttribute("maxlength"), false)
  })

  it("ignores non-boost inputs", () => {
    const input = otherInput()
    document.body.appendChild(input)

    unlimitBoostInputs(document)

    assert.equal(input.getAttribute("maxlength"), "255")
  })

  it("ignores boost inputs that already lack maxlength", () => {
    const input = boostInput(null)
    document.body.appendChild(input)

    unlimitBoostInputs(document)

    assert.equal(input.hasAttribute("maxlength"), false)
  })

  it("only processes within the given root element", () => {
    const container = document.createElement("div")
    const inside = boostInput()
    const outside = boostInput()
    container.appendChild(inside)
    document.body.appendChild(container)
    document.body.appendChild(outside)

    unlimitBoostInputs(container)

    assert.equal(inside.hasAttribute("maxlength"), false)
    assert.equal(outside.getAttribute("maxlength"), "16")
  })
})

describe("border feedback on v4 markup", () => {
  function boostForm() {
    const form = document.createElement("form")
    const input = boostInput()
    form.appendChild(input)
    document.body.appendChild(form)
    unlimitBoostInputs(document)
    return { form, input }
  }

  it("has no border at or below 16 characters", () => {
    const { form, input } = boostForm()

    typeInto(input, "a".repeat(16))

    assert.equal(form.style.border, "")
  })

  it("has a gold border above 16 characters", () => {
    const { form, input } = boostForm()

    typeInto(input, "a".repeat(17))

    assert.equal(form.style.border, "3px solid gold")
  })

  it("has a gold border at 32 characters", () => {
    const { form, input } = boostForm()

    typeInto(input, "a".repeat(32))

    assert.equal(form.style.border, "3px solid gold")
  })

  it("has a red border above 32 characters", () => {
    const { form, input } = boostForm()

    typeInto(input, "a".repeat(33))

    assert.equal(form.style.border, "3px solid red")
  })

  it("clears the border when typing back below threshold", () => {
    const { form, input } = boostForm()

    typeInto(input, "a".repeat(20))
    assert.equal(form.style.border, "3px solid gold")

    typeInto(input, "a".repeat(10))
    assert.equal(form.style.border, "")
  })
})

describe("border feedback on v5 markup", () => {
  function v5BoostComposer() {
    const composer = document.createElement("div")
    composer.className = "boost boost--composer"
    const form = document.createElement("form")
    form.className = "boost__form"
    form.style.display = "contents"
    const input = boostInput()
    form.appendChild(input)
    composer.appendChild(form)
    document.body.appendChild(composer)
    unlimitBoostInputs(document)
    return { composer, form, input }
  }

  it("puts the gold border on the visible composer, not the display:contents form", () => {
    const { composer, form, input } = v5BoostComposer()

    typeInto(input, "a".repeat(17))

    assert.equal(composer.style.border, "3px solid gold")
    assert.equal(form.style.border, "")
  })

  it("puts the red border on the visible composer above 32 characters", () => {
    const { composer, form, input } = v5BoostComposer()

    typeInto(input, "a".repeat(33))

    assert.equal(composer.style.border, "3px solid red")
    assert.equal(form.style.border, "")
  })

  it("clears the composer border when typing back below threshold", () => {
    const { composer, input } = v5BoostComposer()

    typeInto(input, "a".repeat(20))
    assert.equal(composer.style.border, "3px solid gold")

    typeInto(input, "a".repeat(10))
    assert.equal(composer.style.border, "")
  })
})

describe("observeBoostInputs", () => {
  it("removes maxlength from existing boost inputs on the page", () => {
    const input = boostInput()
    document.body.appendChild(input)

    observeBoostInputs()

    assert.equal(input.hasAttribute("maxlength"), false)
  })

  it("removes maxlength from dynamically added boost inputs", async () => {
    observeBoostInputs()

    const input = boostInput()
    document.body.appendChild(input)

    await new Promise(resolve => setTimeout(resolve, 0))

    assert.equal(input.hasAttribute("maxlength"), false)
  })

  it("removes maxlength from boost inputs nested in dynamically added elements", async () => {
    observeBoostInputs()

    const container = document.createElement("div")
    const input = boostInput()
    container.appendChild(input)
    document.body.appendChild(container)

    await new Promise(resolve => setTimeout(resolve, 0))

    assert.equal(input.hasAttribute("maxlength"), false)
  })

  it("removes maxlength from boost inputs added inside an existing nested element (turbo-frame scenario)", async () => {
    const turboFrame = document.createElement("div")
    turboFrame.id = "new_boost_recording_123"
    document.body.appendChild(turboFrame)

    observeBoostInputs()

    const form = document.createElement("form")
    const input = boostInput()
    form.appendChild(input)
    turboFrame.appendChild(form)

    await new Promise(resolve => setTimeout(resolve, 0))

    assert.equal(input.hasAttribute("maxlength"), false)
  })

  it("removes maxlength after Turbo Drive replaces document.body", async () => {
    observeBoostInputs()

    // simulate Turbo Drive navigation: document.body.replaceWith(newBody)
    const newBody = document.createElement("body")
    const input = boostInput()
    newBody.appendChild(input)
    document.body.replaceWith(newBody)

    await new Promise(resolve => setTimeout(resolve, 0))

    assert.equal(input.hasAttribute("maxlength"), false)
  })
})
