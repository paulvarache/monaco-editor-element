#!/bin/sh
rm -rf ./dist
mkdir ./dist
cp -r node_modules/monaco-editor/min/ ./dist/monaco-editor/
sed -i -e 's/function f(e){for(;e;){if(e===document.body)return!0;e=e.parentNode}return!1}/function f(e){for(;e;){if(e===document.body)return!0;e=e.parentNode||e.host}return!1}/' dist/monaco-editor/vs/editor/editor.main.js
cp ./monaco-editor.js ./dist/monaco-editor.js
./node_modules/.bin/babel ./monaco-editor.js -o ./dist/monaco-editor.es5.js
./node_modules/.bin/uglifyjs ./dist/monaco-editor.es5.js -o ./dist/monaco-editor.es5.min.js