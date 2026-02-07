const { JSDOM } = require("jsdom")
const assert = require("node:assert/strict")
const { describe, it, beforeEach } = require("node:test")

const { unlimitBoostInputs, observeBoostInputs } = require("./content")

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

let dom

beforeEach(() => {
  dom = new JSDOM("<!DOCTYPE html><html><body></body></html>")
  global.document = dom.window.document
  global.Node = dom.window.Node
  global.MutationObserver = dom.window.MutationObserver
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

    // MutationObserver callbacks are microtasks
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
})
