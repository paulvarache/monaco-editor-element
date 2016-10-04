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

        return _possibleConstructorReturn(this, (MonacoEditor.__proto__ || Object.getPrototypeOf(MonacoEditor)).apply(this, arguments));
    }

    _createClass(MonacoEditor, [{
        key: 'createdCallback',
        value: function createdCallback() {
            this.properties = ['value', 'language', 'theme', 'readOnly', 'lineNumbers', 'namespace'];
            this.defaults = {
                language: 'javascript',
                value: '',
                lineNumbers: true,
                readOnly: false,
                namespace: './dist/monaco-editor/vs'
            };
            this._getInitialValues();
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

            this.loading = true;
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
                _this2.editor = monaco.editor.create(_this2.container, _this2._getProperties());
                _this2.editor.viewModel._shadowRoot = _this2.root;
                _this2.bindEvents();
                _this2.loading = false;
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
                require.config({ paths: { 'vs': _this4._getProperties().namespace } });
                require(['vs/editor/editor.main'], resolve);
            });
        }

        /**
         * We need to embed this stylesheet in a style tag inside the shadow root
         */

    }, {
        key: '_loadStylesheet',
        value: function _loadStylesheet() {
            return fetch(this._getProperties().namespace + '/editor/editor.main.css').then(function (r) {
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
            switch (name) {
                case 'value':
                    {
                        this._setProperty('value', newValue);
                        this._updateValue();
                        break;
                    }
                case 'theme':
                    {
                        this._setProperty(name, newValue);
                        break;
                    }
                case 'read-only':
                    {
                        this._setProperty('readOnly', newValue !== null);
                        break;
                    }
                case 'no-line-numbers':
                    {
                        this._setProperty('lineNumbers', newValue === null);
                        break;
                    }
            }
        }
    }, {
        key: '_setProperty',
        value: function _setProperty(name, value) {
            if (value === null) {
                delete this[name];
            } else {
                this[name] = value;
            }
            this._updateOptions();
        }
    }, {
        key: '_getInitialValues',
        value: function _getInitialValues() {
            var opts = {
                namespace: this.getAttribute('namespace'),
                value: this.getAttribute('value'),
                theme: this.getAttribute('theme'),
                language: this.getAttribute('language'),
                readOnly: this.getAttribute('read-only') !== null,
                lineNumbers: this.getAttribute('no-line-numbers') === null
            };
            this.updateOptions(opts);
        }
    }, {
        key: 'updateOptions',
        value: function updateOptions(opts) {
            var _this5 = this;

            this.properties.forEach(function (key) {
                if (typeof opts[key] !== 'undefined') {
                    _this5[key] = opts[key];
                }
            });
            if (this.editor) {
                this.editor.updateOptions(this._getProperties());
            }
        }
    }, {
        key: '_updateValue',
        value: function _updateValue() {
            this.editor.setValue(this._getProperties().value);
        }
    }, {
        key: '_getProperties',
        value: function _getProperties() {
            var opts = {
                namespace: this.namespace || this.defaults.namespace,
                value: this.value || this.defaults.value,
                theme: this.theme || this.defaults.theme,
                language: this.language || this.defaults.language,
                readOnly: typeof this.readOnly === 'undefined' ? this.defaults.readOnly : this.readOnly,
                lineNumbers: typeof this.lineNumbers === 'undefined' ? this.defaults.lineNumbers : this.lineNumbers
            };
            Object.keys(opts).forEach(function (key) {
                if (typeof opts[key] === 'undefined') {
                    delete opts[key];
                }
            });
            return opts;
        }
    }, {
        key: 'getEditor',
        value: function getEditor() {
            return this.editor;
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
