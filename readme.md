# monaco-editor-element

A custom element wrapper for the Monaco editor by Microsoft.

Quick example:

```html
<monaco-editor></monaco-editor>
```

Customizable attributes: 

 - `namespace`: Where to find the `monaco-editor` source, default *node_modules/monaco-editor/min/vs*
 - `language`: Which language parser to use, default *javascript* ( Can't be changed after first render )
 - `value`: Content of the editor
 - `theme`
 - `read-only`
 - `no-line-numbers`


Integration:

Due to the fact that `monaco-editor` is only available through `npm`, that I couldn't find a public repository of the source code and that it heavily depends on `requirejs` some compromises have been made.
The editor needs its loader to work.
You can find that script under `node_modules/monaco-editor/min/vs`. You need to tell the element where the loader comes from so that `requirejs` can resolve the right modules. This is why the namespace attribute is here.
If you want to host the `monaco-editor` somewhere else than the `node_modules` folder (I definitely will), you need to update these values.

Example:
Let's say you put the editor's files under a `vendor` folder.
Create a file to import the `monaco-editor` dependencies like so:

```html
<!-- monaco-editor-import.html -->
<!-- Requires the editor's code -->
<script src="/vendor/monaco-editor/min/vs/loader.js"></script>
<!-- Imports the custom element wrapper -->
<script src="./monaco-editor.js"></script>
```

Then In your app, you can simply:

```html
<link rel="import" href="./monaco-editor-import.html">

<!-- Make sure the editor knows where to find the source -->
<monaco-editor namespace="vendor/monaco-editor/min/vs"></monaco-editor>
```

When the first `monaco-editor` is created the dependencies are retrieved and you'll be notified by a `ready` event when it is... well... ready.

You can access the `editor` object to gain full control of the customization by calling `.getEditor()` on the custom elements 