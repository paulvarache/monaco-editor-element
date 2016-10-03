#!/bin/sh

rm -rf ./dist
mkdir ./dist
./node_modules/.bin/babel ./monaco-editor.js -o ./dist/monaco-editor.js
./node_modules/.bin/uglifyjs ./dist/monaco-editor.js -o ./dist/monaco-editor.min.js