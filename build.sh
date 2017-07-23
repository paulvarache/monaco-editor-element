#!/bin/sh
rm -rf ./dist
mkdir ./dist
cp -r node_modules/monaco-editor/min/ ./dist/monaco-editor/
cp node_modules/monaco-editor/dev/vs/editor/editor.main.js ./dist/monaco-editor/vs/editor/editor.main.js
sed -i -e 's/node = node.parentNode;/node = node.parentNode || node.host;/' ./dist/monaco-editor/vs/editor/editor.main.js
sed -i -e 's/this.target = e.target/this.target = e.path ? e.path[0] : e.target/' ./dist/monaco-editor/vs/editor/editor.main.js
sed -i -e 's/var range = document.caretRangeFromPoint(coords.clientX, coords.clientY);/var docOrRoot = ctx.model._shadowRoot || document;var range = docOrRoot.caretRangeFromPoint(coords.clientX, coords.clientY);/' ./dist/monaco-editor/vs/editor/editor.main.js
./node_modules/.bin/uglifyjs ./dist/monaco-editor/vs/editor/editor.main.js -o ./dist/monaco-editor/vs/editor/editor.main.js
cp ./monaco-editor.js ./dist/monaco-editor.js
./node_modules/.bin/babel ./monaco-editor.js -o ./dist/monaco-editor.es5.js
./node_modules/.bin/uglifyjs ./dist/monaco-editor.es5.js -o ./dist/monaco-editor.es5.min.js