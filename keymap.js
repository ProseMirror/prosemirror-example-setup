const {HardBreak, BulletList, OrderedList, ListItem, BlockQuote, HorizontalRule, Paragraph, CodeBlock, Heading,
       StrongMark, EmMark, CodeMark} = require("../schema-basic")
const browser = require("../util/browser")
const {wrapIn, setBlockType, chainCommands, newlineInCode, toggleMark} = require("../commands")
const {TableRow, selectNextCell, selectPreviousCell} = require("../schema-table")
const {wrapInList, splitListItem, liftListItem, sinkListItem} = require("../commands-list")

// :: (Schema, ?Object) → Object
// Inspect the given schema looking for marks and nodes from the
// basic schema, and if found, add key bindings related to them.
// This will add:
//
// * **Mod-KeyB** for toggling [strong](#StrongMark)
// * **Mod-KeyI** for toggling [emphasis](#EmMark)
// * **Mod-Backquote** for toggling [code font](#CodeMark)
// * **Ctrl-Shift-Digit0** for making the current textblock a paragraph
// * **Ctrl-Shift-Digit1** to **Ctrl-Shift-Digit6** for making the current
//   textblock a heading of the corresponding level
// * **Ctrl-Shift-Backslash** to make the current textblock a code block
// * **Ctrl-Shift-Digit8** to wrap the selection in an ordered list
// * **Ctrl-Shift-Digit9** to wrap the selection in a bullet list
// * **Ctrl-Shift-Period** to wrap the selection in a block quote
// * **Enter** to split a non-empty textblock in a list item while at
//   the same time splitting the list item
// * **Mod-Enter** to insert a hard break
// * **Mod-Shift-Minus** to insert a horizontal rule
//
// You can suppress or map these bindings by passing a `mapKeys`
// argument, which maps key names (say `"Mod-B"` to either `false`, to
// remove the binding, or a new key name string.
function buildKeymap(schema, mapKeys, history) {
  let keys = {}
  function bind(key, cmd) {
    if (mapKeys) {
      let mapped = mapKeys[key]
      if (mapped === false) return
      if (mapped) key = mapped
    }
    keys[key] = cmd
  }

  bind("Mod-Z", history.undo)
  bind("Mod-Y", history.redo)

  for (let name in schema.marks) {
    let mark = schema.marks[name]
    if (mark instanceof StrongMark)
      bind("Mod-KeyB", toggleMark(mark))
    if (mark instanceof EmMark)
      bind("Mod-KeyI", toggleMark(mark))
    if (mark instanceof CodeMark)
      bind("Mod-Backquote", toggleMark(mark))
  }
  for (let name in schema.nodes) {
    let node = schema.nodes[name]
    if (node instanceof BulletList)
      bind("Shift-Ctrl-Digit8", wrapInList(node))
    if (node instanceof OrderedList)
      bind("Shift-Ctrl-Digit9", wrapInList(node))
    if (node instanceof BlockQuote)
      bind("Shift-Ctrl-Period", wrapIn(node))
    if (node instanceof HardBreak) {
      let cmd = chainCommands(newlineInCode, (state, onAction) => {
        onAction(state.tr.replaceSelection(node.create()).scrollAction())
        return true
      })
      bind("Mod-Enter", cmd)
      bind("Shift-Enter", cmd)
      if (browser.mac) bind("Ctrl-Enter", cmd)
    }
    if (node instanceof ListItem) {
      bind("Enter", splitListItem(node))
      bind("Mod-BracketLeft", liftListItem(node))
      bind("Mod-BracketRight", sinkListItem(node))
    }
    if (node instanceof Paragraph)
      bind("Shift-Ctrl-Digit0", setBlockType(node))
    if (node instanceof CodeBlock)
      bind("Shift-Ctrl-Backslash", setBlockType(node))
    if (node instanceof Heading) for (let i = 1; i <= 6; i++)
      bind("Shift-Ctrl-Digit" + i, setBlockType(node, {level: i}))
    if (node instanceof HorizontalRule)
      bind("Mod-Shift-Minus", (state, onAction) => {
        onAction(state.tr.replaceSelection(node.create()).scrollAction())
        return true
      })

    if (node instanceof TableRow) {
      bind("Tab", selectNextCell)
      bind("Shift-Tab", selectPreviousCell)
    }
  }
  return keys
}
exports.buildKeymap = buildKeymap
