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
    }

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

class MonacoEditor extends HTMLElement {

    createdCallback () {
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

    attachedCallback () {
        this.connectedCallback.apply(this, arguments);
    }

    detachedCallback () {
        this.disconnectedCallback.apply(this, arguments);
    }

    connectedCallback () {
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
        this._loadDependency().then(() => {
            // Fill the style element with the stylesheet content
            this.styleEl.innerHTML = MonacoEditor._styleText;
            // Create the editor
            this.editor = monaco.editor.create(this.container, this._getProperties());
            this.editor.viewModel._shadowRoot = this.root;
            this.bindEvents();
            this.loading = false;
            // Notify that the editor is ready
            this.dispatchEvent(new CustomEvent('ready', { bubbles: true }));
        });
    }

    bindEvents () {
        this.editor.onDidChangeModelContent(event => {
            this.value = this.editor.getValue();
            this.dispatchEvent(new CustomEvent('changed', { bubbles: true }));
        });
    }

    /**
    * Loads the monaco dependencies and the required stylesheet. Prevent data to be loaded twice
    */
    _loadDependency () {
        if (!MonacoEditor._loadingPromise) {
            MonacoEditor._loadingPromise = Promise.all([
                this._loadMonaco(),
                this._loadStylesheet()
            ]);
        }
        return MonacoEditor._loadingPromise;
    }

    /**
     * Use the require method from the vscode-loader to import all the dependencies
     */
    _loadMonaco () {
        return new Promise((resolve, reject) => {
            require.config({ paths: { 'vs': this._getProperties().namespace }});
            require(['vs/editor/editor.main'], resolve);
        });
    }

    /**
     * We need to embed this stylesheet in a style tag inside the shadow root
     */
    _loadStylesheet () {
        return fetch(`${this._getProperties().namespace}/editor/editor.main.css`)
            .then(r => r.text())
            .then(style => {
                MonacoEditor._styleText = style;
                return style;
            });
    }

    disconnectedCallback () {
        this.removeChild(this.container);
        this.editor.dispose();
    }

    attributeChangedCallback (name, oldValue, newValue) {
        switch (name) {
            case 'value': {
                this._setProperty('value', newValue);
                this._updateValue();
                break;
            }
            case 'theme': {
                this._setProperty(name, newValue);
                break;
            }
            case 'read-only': {
                this._setProperty('readOnly', (newValue !== null));
                break;
            }
            case 'no-line-numbers': {
                this._setProperty('lineNumbers', (newValue === null));
                break;
            }
        }
    }

    _setProperty (name, value) {
        if (value === null) {
            delete this[name];
        } else {
            this[name] = value;
        }
        this._updateOptions();
    }

    _getInitialValues () {
        let opts = {
            namespace: this.getAttribute('namespace'),
            value: this.getAttribute('value'),
            theme: this.getAttribute('theme'),
            language: this.getAttribute('language'),
            readOnly: (this.getAttribute('read-only') !== null),
            lineNumbers: (this.getAttribute('no-line-numbers') === null)
        };
        this.updateOptions(opts);
    }

    updateOptions (opts) {
        this.properties.forEach(key => {
            if (typeof opts[key] !== 'undefined') {
                this[key] = opts[key];
            }
        });
        if (this.editor) {
            this.editor.updateOptions(this._getProperties());
        }
    }

    _updateValue () {
        this.editor.setValue(this._getProperties().value);
    }

    _getProperties () {
        let opts = {
            namespace: this.namespace || this.defaults.namespace,
            value: this.value || this.defaults.value,
            theme: this.theme || this.defaults.theme,
            language: this.language || this.defaults.language,
            readOnly: typeof this.readOnly === 'undefined' ?  this.defaults.readOnly : this.readOnly,
            lineNumbers: typeof this.lineNumbers === 'undefined' ?  this.defaults.lineNumbers : this.lineNumbers
        };
        Object.keys(opts).forEach(key => {
            if (typeof opts[key] === 'undefined') {
                delete opts[key];
            }
        });
        return opts;
    }

    getEditor () {
        return this.editor;
    }
}

if ('customElements' in window) {
    customElements.define('monaco-editor', MonacoEditor);
} else if ('registerElement' in document) {
    document.registerElement('monaco-editor', MonacoEditor);
} else {
    console.error('Defining a custom element is not supported in this browser');
}

