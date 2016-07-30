const {blockQuoteRule, orderedListRule, bulletListRule, codeBlockRule, headingRule,
       inputRules, allInputRules} = require("../inputrules")
const {BlockQuote, OrderedList, BulletList, CodeBlock, Heading} = require("../schema-basic")
const {keymap} = require("../keymap")
const {history} = require("../history")
const {menuBar} = require("../menu")
const {editorPrompt} = require("../prompt")
const {baseKeymap} = require("../commands")

const {className} = require("./style")
const {buildMenuItems} = require("./menu")
exports.buildMenuItems = buildMenuItems
const {buildKeymap} = require("./keymap")
exports.buildKeymap = buildKeymap

// !! This module exports helper functions for deriving a set of basic
// menu items, input rules, or key bindings from a schema. These
// values need to know about the schema for two reasons—they need
// access to specific instances of node and mark types, and they need
// to know which of the node and mark types that they know about are
// actually present in the schema.
//
// The `exampleSetup` plugin ties these together into a plugin that
// will automatically enable this basic functionality in an editor.

// :: () → Object
// A convenience plugin that bundles together a simple menu with basic
// key bindings, input rules, and styling for the example schema.
// Probably only useful for quickly setting up a passable
// editor—you'll need more control over your settings in most
// real-world situations. The following options are recognized:
//
// **`menuBar`**`: union<bool, Object> = true`
//   : Enable or configure the menu bar. `false` turns it off, `true`
//     enables it with the default options, and passing an object will
//     pass that value on as the options for the menu bar.
//
// **`mapKeys`**: ?Object = null`
//   : Can be used to [adjust](#buildKeymap) the key bindings created.
exports.exampleSetup = function(options) {
  let hist = history()

  return [
    {className}, // FIXME use
    editorPrompt(),
    keymap(buildKeymap(options.schema, options.mapKeys)),
    keymap(baseKeymap),
    inputRules({rules: allInputRules.concat(buildInputRules(options.schema))}),
    hist,
    menuBar(options.menuBar || {float: true, content: buildMenuItems(options.schema, hist).fullMenu})
  ]
}

// :: (Schema) → [InputRule]
// A set of input rules for creating the basic block quotes, lists,
// code blocks, and heading.
function buildInputRules(schema) {
  let result = []
  for (let name in schema.nodes) {
    let node = schema.nodes[name]
    if (node instanceof BlockQuote) result.push(blockQuoteRule(node))
    if (node instanceof OrderedList) result.push(orderedListRule(node))
    if (node instanceof BulletList) result.push(bulletListRule(node))
    if (node instanceof CodeBlock) result.push(codeBlockRule(node))
    if (node instanceof Heading) result.push(headingRule(node, 6))
  }
  return result
}
exports.buildInputRules = buildInputRules
