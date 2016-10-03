#!/bin/sh
npm install
sed -i -e 's/function f(e){for(;e;){if(e===document.body)return!0;e=e.parentNode}return!1}/function f(e){for(;e;){if(e===document.body)return!0;e=e.parentNode||e.host}return!1}/' node_modules/monaco-editor/min/vs/editor/editor.main.js