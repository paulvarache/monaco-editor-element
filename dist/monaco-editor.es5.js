'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

(function (window) {
    window._getCharWidth = function (char, font) {
        var cacheKey = char + font;
        if (window._getCharWidth._cache[cacheKey]) {
            return window._getCharWidth._cache[cacheKey];
        }
        var context = window._getCharWidth._canvas.getContext("2d");
        context.font = font;
        var metrics = context.measureText(char);
        var width = metrics.width;
        window._getCharWidth._cache[cacheKey] = width;
        return width;
    };

    window._getCharWidth._cache = {};
    window._getCharWidth._canvas = document.createElement('canvas');
})(window);

// Dynamically polyfill the `caretRangeFromPoint` method
if (typeof ShadowRoot.prototype.caretRangeFromPoint === 'undefined') {
    /**
     * The `best I can do` polyfill for this method
     */
    ShadowRoot.prototype.caretRangeFromPoint = function (x, y) {
        // Get the element under the point
        var el = this.elementFromPoint(x, y);

        // Get the last child of the element until its firstChild is a text node
        // This assumes that the pointer is on the right of the line, out of the tokens
        // and that we want to get the offset of the last token of the line
        while (el.firstChild.nodeType !== el.firstChild.TEXT_NODE) {
            el = el.lastChild;
        }

        // Grab its rect
        var rect = el.getBoundingClientRect();
        // And its font
        var font = window.getComputedStyle(el, null).getPropertyValue('font');

        // And also its txt content
        var text = el.innerText;

        // Poisition the pixel cursor at the left of the element
        var pixelCursor = rect.left;
        var offset = 0;
        var step;

        // If the point is on the right of the box put the cursor after the last character
        if (x > rect.left + rect.width) {
            offset = text.length;
        } else {
            // Goes through all the characters of the innerText, and checks if the x of the point
            // belongs to the character.
            for (var i = 0; i < text.length + 1; i++) {
                // The step is half the width of the character
                step = window._getCharWidth(text.charAt(i), font) / 2;
                // Move to the center of the character
                pixelCursor += step;
                // If the x of the point is smaller that the position of the cursor, the point is over that character
                if (x < pixelCursor) {
                    offset = i;
                    foundPos = true;
                    break;
                }
                // Move between the current character and the next
                pixelCursor += step;
            }
        }

        // Creates a range with the text node of the element and set the offset found
        var range = document.createRange();
        range.setStart(el.firstChild, offset);
        range.setEnd(el.firstChild, offset);

        return range;
    };
}

var MonacoEditor = function (_HTMLElement) {
    _inherits(MonacoEditor, _HTMLElement);

    function MonacoEditor() {
        _classCallCheck(this, MonacoEditor);

        var _this = _possibleConstructorReturn(this, (MonacoEditor.__proto__ || Object.getPrototypeOf(MonacoEditor)).call(this));

        _this.createdCallback();
        return _this;
    }

    _createClass(MonacoEditor, [{
        key: 'createdCallback',
        value: function createdCallback() {
            this._readOnly = false;
            this._language = 'javascript';
            this._value = '';
            this._theme = 'vs';
            this._noLineNumbers = false;
            this._namespace = './dist/monaco-editor/vs';

            console.log(this.editorOptions);
        }
    }, {
        key: 'attachedCallback',
        value: function attachedCallback() {
            this.connectedCallback.apply(this, arguments);
        }
    }, {
        key: 'detachedCallback',
        value: function detachedCallback() {
            this.disconnectedCallback.apply(this, arguments);
        }
    }, {
        key: 'connectedCallback',
        value: function connectedCallback() {
            var _this2 = this;

            var attributes = ['value', 'language', 'readOnly', 'noLineNumbers', 'theme', 'namespace'],
                attrValue = void 0;
            attributes.forEach(function (attribute) {
                attrValue = _this2.getAttribute(attribute);
                if (attrValue !== null) {
                    _this2.attributeChangedCallback(attribute, null, attrValue);
                }
            });
            this._loading = true;
            // Create a shadow root to host the style and the editor's container'
            this.root = typeof this.attachShadow === 'function' ? this.attachShadow({ mode: 'open' }) : this.createShadowRoot();
            this.styleEl = document.createElement('style');
            this.container = document.createElement('div');
            // Expand the container to the element's size
            this.container.style.width = '100%';
            this.container.style.height = '100%';
            // Append the style and container to the shadow root
            this.root.appendChild(this.styleEl);
            this.root.appendChild(this.container);
            // Get the dependencies if needed
            this._loadDependency().then(function () {
                // Fill the style element with the stylesheet content
                _this2.styleEl.innerHTML = MonacoEditor._styleText;
                // Create the editor
                _this2.editor = monaco.editor.create(_this2.container, _this2.editorOptions);
                _this2.editor.viewModel._shadowRoot = _this2.root;
                _this2.bindEvents();
                _this2._loading = false;
                // Notify that the editor is ready
                _this2.dispatchEvent(new CustomEvent('ready', { bubbles: true }));
            });
        }
    }, {
        key: 'bindEvents',
        value: function bindEvents() {
            var _this3 = this;

            this.editor.onDidChangeModelContent(function (event) {
                _this3.value = _this3.editor.getValue();
                _this3.dispatchEvent(new CustomEvent('changed', { bubbles: true }));
            });
        }

        /**
        * Loads the monaco dependencies and the required stylesheet. Prevent data to be loaded twice
        */

    }, {
        key: '_loadDependency',
        value: function _loadDependency() {
            if (!MonacoEditor._loadingPromise) {
                MonacoEditor._loadingPromise = Promise.all([this._loadMonaco(), this._loadStylesheet()]);
            }
            return MonacoEditor._loadingPromise;
        }

        /**
         * Use the require method from the vscode-loader to import all the dependencies
         */

    }, {
        key: '_loadMonaco',
        value: function _loadMonaco() {
            var _this4 = this;

            return new Promise(function (resolve, reject) {
                require.config({ paths: { 'vs': _this4.editorOptions.namespace } });
                require(['vs/editor/editor.main'], resolve);
            });
        }

        /**
         * We need to embed this stylesheet in a style tag inside the shadow root
         */

    }, {
        key: '_loadStylesheet',
        value: function _loadStylesheet() {
            return fetch(this.editorOptions.namespace + '/editor/editor.main.css').then(function (r) {
                return r.text();
            }).then(function (style) {
                MonacoEditor._styleText = style;
                return style;
            });
        }
    }, {
        key: 'disconnectedCallback',
        value: function disconnectedCallback() {
            this.removeChild(this.container);
            this.editor.dispose();
        }
    }, {
        key: 'attributeChangedCallback',
        value: function attributeChangedCallback(name, oldValue, newValue) {
            var camelCased = name.replace(/-([a-z])/g, function (m, w) {
                return w.toUpperCase();
            });
            console.log(name, camelCased);
            this[camelCased] = newValue;
        }
    }, {
        key: 'getEditor',
        value: function getEditor() {
            return this.editor;
        }
    }, {
        key: 'value',
        set: function set(value) {
            if (this._value === value) {
                return;
            }
            this._value = value;
            if (this.editor) {
                this.editor.setValue(this._value);
            }
        },
        get: function get() {
            return this._value;
        }
    }, {
        key: 'theme',
        set: function set(t) {
            if (this._theme === t) {
                return;
            }
            this._theme = t;
            if (this.editor) {
                this.editor.updateOptions({ theme: this._theme });
            }
        },
        get: function get() {
            return this._theme;
        }
    }, {
        key: 'readOnly',
        set: function set(r) {
            if (this._readOnly === r) {
                return;
            }
            this._readOnly = r;
            if (this.editor) {
                this.editor.updateOptions({ readOnly: this._readOnly });
            }
        },
        get: function get() {
            return this._readOnly;
        }
    }, {
        key: 'noLineNumbers',
        set: function set(v) {
            if (this._noLineNumbers === v) {
                return;
            }
            this._noLineNumbers = v;
            if (this.editor) {
                this.editor.updateOptions({ lineNumbers: !this._noLineNumbers });
            }
        },
        get: function get() {
            return this._noLineNumbers;
        }
    }, {
        key: 'editorOptions',
        get: function get() {
            return {
                namespace: this.namespace,
                value: this.value,
                theme: this.theme,
                language: this.language,
                readOnly: this.readOnly,
                lineNumbers: !this.noLineNumbers
            };
        }
    }, {
        key: 'namespace',
        set: function set(ns) {
            if (this._namespace === ns) {
                return;
            }
            this._namespace = ns;
        },
        get: function get() {
            return this._namespace;
        }
    }, {
        key: 'language',
        set: function set(l) {
            if (this._language === l) {
                return;
            }
            this._language = l;
            if (this.editor) {
                this.editor.updateOptions({ language: this._language });
            }
        },
        get: function get() {
            return this._language;
        }
    }, {
        key: 'loading',
        get: function get() {
            return this._loading;
        }
    }]);

    return MonacoEditor;
}(HTMLElement);

if ('customElements' in window) {
    customElements.define('monaco-editor', MonacoEditor);
} else if ('registerElement' in document) {
    document.registerElement('monaco-editor', MonacoEditor);
} else {
    console.error('Defining a custom element is not supported in this browser');
}
