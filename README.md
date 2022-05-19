# prosemirror-example-setup

[ [**WEBSITE**](https://prosemirror.net) | [**ISSUES**](https://github.com/prosemirror/prosemirror-example-setup/issues) | [**FORUM**](https://discuss.prosemirror.net) | [**GITTER**](https://gitter.im/ProseMirror/prosemirror) ]

This is a non-core example module for [ProseMirror](https://prosemirror.net).
ProseMirror is a well-behaved rich semantic content editor based on
contentEditable, with support for collaborative editing and custom
document schemas.

This module provides an example of the glue code one might write to
tie the modules that make up ProseMirror into an actual presentable
editor. It is not meant to be very reusable, though it might be
helpful to get something up-and-running quickly.

The [project page](https://prosemirror.net) has more information, a
number of [examples](https://prosemirror.net/examples/) and the
[documentation](https://prosemirror.net/docs/).

This code is released under an
[MIT license](https://github.com/prosemirror/prosemirror/tree/master/LICENSE).
There's a [forum](http://discuss.prosemirror.net) for general
discussion and support requests, and the
[Github bug tracker](https://github.com/prosemirror/prosemirror-example-setup/issues)
is the place to report issues.

## Documentation

This module exports helper functions for deriving a set of basic menu
items, input rules, or key bindings from a schema. These values need
to know about the schema for two reasons—they need access to specific
instances of node and mark types, and they need to know which of the
node and mark types that they know about are actually present in the
schema.

 * **`exampleSetup`**`(options: Object) → Plugin[]`\
   Create an array of plugins pre-configured for the given schema.
   The resulting array will include the following plugins:

    * Input rules for smart quotes and creating the block types in the
      schema using markdown conventions (say `"> "` to create a
      blockquote)

    * A keymap that defines keys to create and manipulate the nodes in the
      schema

    * A keymap binding the default keys provided by the
      prosemirror-commands module

    * The undo history plugin

    * The drop cursor plugin

    * The gap cursor plugin

    * A custom plugin that adds a `menuContent` prop for the
      prosemirror-menu wrapper, and a CSS class that enables the
      additional styling defined in `style/style.css` in this package

   Probably only useful for quickly setting up a passable
   editor—you'll need more control over your settings in most
   real-world situations.

    * **`options`**`: Object`

       * **`schema`**`: Schema`\
         The schema to generate key bindings and menu items for.

       * **`mapKeys`**`?: Object`\
         Can be used to [adjust](#example-setup.buildKeymap) the key bindings created.

       * **`menuBar`**`?: boolean`\
         Set to false to disable the menu bar.

       * **`history`**`?: boolean`\
         Set to false to disable the history plugin.

       * **`floatingMenu`**`?: boolean`\
         Set to false to make the menu bar non-floating.

       * **`menuContent`**`?: MenuItem[][]`\
         Can be used to override the menu content.


 * **`buildMenuItems`**`(schema: Schema) → {makeHead2?: MenuItem, makeHead3?: MenuItem, makeHead4?: MenuItem, makeHead5?: MenuItem, makeHead6?: MenuItem}`\
   Given a schema, look for default mark and node types in it and
   return an object with relevant menu items relating to those marks.

    * **`returns`**`: {makeHead2?: MenuItem, makeHead3?: MenuItem, makeHead4?: MenuItem, makeHead5?: MenuItem, makeHead6?: MenuItem}`

       * **`toggleStrong`**`?: MenuItem`\
         A menu item to toggle the [strong mark](#schema-basic.StrongMark).

       * **`toggleEm`**`?: MenuItem`\
         A menu item to toggle the [emphasis mark](#schema-basic.EmMark).

       * **`toggleCode`**`?: MenuItem`\
         A menu item to toggle the [code font mark](#schema-basic.CodeMark).

       * **`toggleLink`**`?: MenuItem`\
         A menu item to toggle the [link mark](#schema-basic.LinkMark).

       * **`insertImage`**`?: MenuItem`\
         A menu item to insert an [image](#schema-basic.Image).

       * **`wrapBulletList`**`?: MenuItem`\
         A menu item to wrap the selection in a [bullet list](#schema-list.BulletList).

       * **`wrapOrderedList`**`?: MenuItem`\
         A menu item to wrap the selection in an [ordered list](#schema-list.OrderedList).

       * **`wrapBlockQuote`**`?: MenuItem`\
         A menu item to wrap the selection in a [block quote](#schema-basic.BlockQuote).

       * **`makeParagraph`**`?: MenuItem`\
         A menu item to set the current textblock to be a normal
         [paragraph](#schema-basic.Paragraph).

       * **`makeCodeBlock`**`?: MenuItem`\
         A menu item to set the current textblock to be a
         [code block](#schema-basic.CodeBlock).

       * **`makeHead1`**`?: MenuItem`\
         Menu items to set the current textblock to be a
         [heading](#schema-basic.Heading) of level _N_.

       * **`insertHorizontalRule`**`?: MenuItem`\
         A menu item to insert a horizontal rule.

       * **`insertMenu`**`: Dropdown`\
         A dropdown containing the `insertImage` and
         `insertHorizontalRule` items.

       * **`typeMenu`**`: Dropdown`\
         A dropdown containing the items for making the current
         textblock a paragraph, code block, or heading.

       * **`blockMenu`**`: MenuElement[][]`\
         Array of block-related menu items.

       * **`inlineMenu`**`: MenuElement[][]`\
         Inline-markup related menu items.

       * **`fullMenu`**`: MenuElement[][]`\
         An array of arrays of menu elements for use as the full menu
         for, for example the [menu
         bar](https://github.com/prosemirror/prosemirror-menu#user-content-menubar).


 * **`buildKeymap`**`(schema: Schema, mapKeys: Object) → Object`\
   Inspect the given schema looking for marks and nodes from the
   basic schema, and if found, add key bindings related to them.
   This will add:

   * **Mod-b** for toggling [strong](#schema-basic.StrongMark)
   * **Mod-i** for toggling [emphasis](#schema-basic.EmMark)
   * **Mod-`** for toggling [code font](#schema-basic.CodeMark)
   * **Ctrl-Shift-0** for making the current textblock a paragraph
   * **Ctrl-Shift-1** to **Ctrl-Shift-Digit6** for making the current
     textblock a heading of the corresponding level
   * **Ctrl-Shift-Backslash** to make the current textblock a code block
   * **Ctrl-Shift-8** to wrap the selection in an ordered list
   * **Ctrl-Shift-9** to wrap the selection in a bullet list
   * **Ctrl->** to wrap the selection in a block quote
   * **Enter** to split a non-empty textblock in a list item while at
     the same time splitting the list item
   * **Mod-Enter** to insert a hard break
   * **Mod-_** to insert a horizontal rule
   * **Backspace** to undo an input rule
   * **Alt-ArrowUp** to `joinUp`
   * **Alt-ArrowDown** to `joinDown`
   * **Mod-BracketLeft** to `lift`
   * **Escape** to `selectParentNode`

   You can suppress or map these bindings by passing a `mapKeys`
   argument, which maps key names (say `"Mod-B"` to either `false`, to
   remove the binding, or a new key name string.


 * **`buildInputRules`**`(schema: Schema) → Plugin`\
   A set of input rules for creating the basic block quotes, lists,
   code blocks, and heading.
