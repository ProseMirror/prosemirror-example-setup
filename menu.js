const {StrongMark, EmMark, CodeMark, LinkMark, Image, BulletList, OrderedList, BlockQuote,
       Heading, Paragraph, CodeBlock, HorizontalRule} = require("../schema-basic")
const {wrapItem, blockTypeItem, Dropdown, DropdownSubmenu, joinUpItem, liftItem,
       selectParentNodeItem, undoItem, redoItem, icons, MenuItem} = require("../menu")
const {Table, TableRow, createTable} = require("../schema-table")
const {toggleMark} = require("../commands")
const {wrapInList} = require("../commands-list")
const {addColumnBefore, addColumnAfter, removeColumn, addRowBefore, addRowAfter, removeRow} = require("../commands-table")
const {TextField, openPrompt} = require("../prompt")
const {copyObj} = require("../util/obj")

// Helpers to create specific types of items

function canInsert(state, nodeType, attrs) {
  let $from = state.selection.$from
  for (let d = $from.depth; d >= 0; d--) {
    let index = $from.index(d)
    if ($from.node(d).canReplaceWith(index, index, nodeType, attrs)) return true
  }
  return false
}

function insertImageItem(nodeType) {
  return new MenuItem({
    title: "Insert image",
    label: "Image",
    select(state) { return canInsert(state, nodeType) },
    run(state, _, view) {
      let {node, from, to} = state.selection, attrs = nodeType && node && node.type == nodeType && node.attrs
      openPrompt({
        title: "Insert image",
        fields: {
          src: new TextField({label: "Location", required: true, value: attrs && attrs.src}),
          title: new TextField({label: "Title", value: attrs && attrs.title}),
          alt: new TextField({label: "Description",
                              value: attrs ? attrs.title : state.doc.textBetween(from, to, " ")})
        },
        // FIXME this (and similar uses) won't have the current state
        // when it runs, leading to problems in, for example, a
        // collaborative setup
        callback(attrs) {
          view.props.onAction(view.state.tr.replaceSelection(nodeType.createAndFill(attrs)).action())
        }
      })
    }
  })
}

function positiveInteger(value) {
  if (!/^[1-9]\d*$/.test(value)) return "Should be a positive integer"
}

function insertTableItem(tableType) {
  return new MenuItem({
    title: "Insert a table",
    run(_, _a, view) {
      openPrompt({
        title: "Insert table",
        fields: {
          rows: new TextField({label: "Rows", validate: positiveInteger}),
          cols: new TextField({label: "Columns", validate: positiveInteger})
        },
        callback({rows, cols}) {
          view.props.onAction(view.state.tr.replaceSelection(createTable(tableType, +rows, +cols)).scrollAction())
        }
      })
    },
    select(state) {
      let $from = state.selection.$from
      for (let d = $from.depth; d >= 0; d--) {
        let index = $from.index(d)
        if ($from.node(d).canReplaceWith(index, index, tableType)) return true
      }
      return false
    },
    label: "Table"
  })
}

function cmdItem(cmd, options) {
  return new MenuItem(copyObj(options, {
    label: options.title,
    run: cmd,
    select(state) { return cmd(state) }
  }))
}

function markActive(state, type) {
  let {from, to, empty} = state.selection
  if (empty) return type.isInSet(state.storedMarks || state.doc.marksAt(from))
  else return state.doc.rangeHasMark(from, to, type)
}

function markItem(markType, options) {
  return cmdItem(toggleMark(markType), copyObj(options, {
    active(state) { return markActive(state, markType) }
  }))
}

function linkItem(markType) {
  return markItem(markType, {
    title: "Add or remove link",
    icon: icons.link,
    run(_, _a, view) {
      openPrompt({
        title: "Create a link",
        fields: {
          href: new TextField({
            label: "Link target",
            required: true,
            clean: (val) => {
              if (!/^https?:\/\//i.test(val))
                val = 'http://' + val
              return val
            }
          }),
          title: new TextField({label: "Title"})
        },
        callback(attrs) {
          toggleMark(markType, attrs)(view.state, view.props.onAction)
        }
      })
    }
  })
}

function wrapListItem(nodeType, options) {
  return cmdItem(wrapInList(nodeType, options.attrs), options)
}

// :: (Schema) → Object
// Given a schema, look for default mark and node types in it and
// return an object with relevant menu items relating to those marks:
//
// **`toggleStrong`**`: MenuItem`
//   : A menu item to toggle the [strong mark](#StrongMark).
//
// **`toggleEm`**`: MenuItem`
//   : A menu item to toggle the [emphasis mark](#EmMark).
//
// **`toggleCode`**`: MenuItem`
//   : A menu item to toggle the [code font mark](#CodeMark).
//
// **`toggleLink`**`: MenuItem`
//   : A menu item to toggle the [link mark](#LinkMark).
//
// **`insertImage`**`: MenuItem`
//   : A menu item to insert an [image](#Image).
//
// **`wrapBulletList`**`: MenuItem`
//   : A menu item to wrap the selection in a [bullet list](#BulletList).
//
// **`wrapOrderedList`**`: MenuItem`
//   : A menu item to wrap the selection in an [ordered list](#OrderedList).
//
// **`wrapBlockQuote`**`: MenuItem`
//   : A menu item to wrap the selection in a [block quote](#BlockQuote).
//
// **`makeParagraph`**`: MenuItem`
//   : A menu item to set the current textblock to be a normal
//     [paragraph](#Paragraph).
//
// **`makeCodeBlock`**`: MenuItem`
//   : A menu item to set the current textblock to be a
//     [code block](#CodeBlock).
//
// **`insertTable`**`: MenuItem`
//   : An item to insert a [table](#schema-table).
//
// **`addRowBefore`**, **`addRowAfter`**, **`removeRow`**, **`addColumnBefore`**, **`addColumnAfter`**, **`removeColumn`**`: MenuItem`
//   : Table-manipulation items.
//
// **`makeHead[N]`**`: MenuItem`
//   : Where _N_ is 1 to 6. Menu items to set the current textblock to
//     be a [heading](#Heading) of level _N_.
//
// **`insertHorizontalRule`**`: MenuItem`
//   : A menu item to insert a horizontal rule.
//
// The return value also contains some prefabricated menu elements and
// menus, that you can use instead of composing your own menu from
// scratch:
//
// **`insertMenu`**`: Dropdown`
//   : A dropdown containing the `insertImage` and
//     `insertHorizontalRule` items.
//
// **`typeMenu`**`: Dropdown`
//   : A dropdown containing the items for making the current
//     textblock a paragraph, code block, or heading.
//
// **`inlineMenu`**`: [[MenuElement]]`
//   : An array of arrays of menu elements for use as the inline menu
//     to, for example, a [tooltip menu](#menu/tooltipmenu).
//
// **`blockMenu`**`: [[MenuElement]]`
//   : An array of arrays of menu elements for use as the block menu
//     to, for example, a [tooltip menu](#menu/tooltipmenu).
//
// **`fullMenu`**`: [[MenuElement]]`
//   : An array of arrays of menu elements for use as the full menu
//     for, for example the [menu bar](#menuBar).
function buildMenuItems(schema, history) {
  let r = {}
  for (let name in schema.marks) {
    let mark = schema.marks[name]
    if (mark instanceof StrongMark)
      r.toggleStrong = markItem(mark, {title: "Toggle strong style", icon: icons.strong})
    if (mark instanceof EmMark)
      r.toggleEm = markItem(mark, {title: "Toggle emphasis", icon: icons.em})
    if (mark instanceof CodeMark)
      r.toggleCode = markItem(mark, {title: "Toggle code font", icon: icons.code})
    if (mark instanceof LinkMark)
      r.toggleLink = linkItem(mark)
  }
  for (let name in schema.nodes) {
    let node = schema.nodes[name]
    if (node instanceof Image)
      r.insertImage = insertImageItem(node)
    if (node instanceof BulletList)
      r.wrapBulletList = wrapListItem(node, {
        title: "Wrap in bullet list",
        icon: icons.bulletList
      })
    if (node instanceof OrderedList)
      r.wrapOrderedList = wrapListItem(node, {
        title: "Wrap in ordered list",
        icon: icons.orderedList
      })
    if (node instanceof BlockQuote)
      r.wrapBlockQuote = wrapItem(node, {
        title: "Wrap in block quote",
        icon: icons.blockquote
      })
    if (node instanceof Paragraph)
      r.makeParagraph = blockTypeItem(node, {
        title: "Change to paragraph",
        label: "Plain"
      })
    if (node instanceof CodeBlock)
      r.makeCodeBlock = blockTypeItem(node, {
        title: "Change to code block",
        label: "Code"
      })
    if (node instanceof Heading)
      for (let i = 1; i <= 10; i++)
        r["makeHead" + i] = blockTypeItem(node, {
          title: "Change to heading " + i,
          label: "Level " + i,
          attrs: {level: i}
        })
    if (node instanceof HorizontalRule)
      r.insertHorizontalRule = new MenuItem({
        title: "Insert horizontal rule",
        label: "Horizontal rule",
        select(state) { return canInsert(state, node) },
        run(state, onAction) { onAction(state.tr.replaceSelection(node.create()).action()) }
      })
    if (node instanceof Table)
      r.insertTable = insertTableItem(node)
    if (node instanceof TableRow) {
      r.addRowBefore = cmdItem(addRowBefore, {title: "Add row before"})
      r.addRowAfter = cmdItem(addRowAfter, {title: "Add row after"})
      r.removeRow = cmdItem(removeRow, {title: "Remove row"})
      r.addColumnBefore = cmdItem(addColumnBefore, {title: "Add column before"})
      r.addColumnAfter = cmdItem(addColumnAfter, {title: "Add column after"})
      r.removeColumn = cmdItem(removeColumn, {title: "Remove column"})
    }
  }

  let cut = arr => arr.filter(x => x)
  r.insertMenu = new Dropdown(cut([r.insertImage, r.insertHorizontalRule, r.insertTable]), {label: "Insert"})
  r.typeMenu = new Dropdown(cut([r.makeParagraph, r.makeCodeBlock, r.makeHead1 && new DropdownSubmenu(cut([
    r.makeHead1, r.makeHead2, r.makeHead3, r.makeHead4, r.makeHead5, r.makeHead6
  ]), {label: "Heading"})]), {label: "Type..."})
  let tableItems = cut([r.addRowBefore, r.addRowAfter, r.removeRow, r.addColumnBefore, r.addColumnAfter, r.removeColumn])
  if (tableItems.length)
    r.tableMenu = new Dropdown(tableItems, {label: "Table"})

  r.inlineMenu = [cut([r.toggleStrong, r.toggleEm, r.toggleCode, r.toggleLink]), [r.insertMenu]]
  r.blockMenu = [cut([r.typeMenu, r.tableMenu, r.wrapBulletList, r.wrapOrderedList, r.wrapBlockQuote, joinUpItem,
                      liftItem, selectParentNodeItem])]
  r.fullMenu = r.inlineMenu.concat(r.blockMenu).concat([[undoItem(history), redoItem(history)]])

  return r
}
exports.buildMenuItems = buildMenuItems
