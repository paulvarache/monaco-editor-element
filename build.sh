#!/bin/sh
rm -rf ./dist
mkdir ./dist
cp ./monaco-editor.js ./dist/monaco-element.js
./node_modules/.bin/babel ./monaco-editor.js -o ./dist/monaco-editor.es5.js
./node_modules/.bin/uglifyjs ./dist/monaco-editor.es5.js -o ./dist/monaco-editor.es5.min.js