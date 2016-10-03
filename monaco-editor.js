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
        this.root = this.createShadowRoot();
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

