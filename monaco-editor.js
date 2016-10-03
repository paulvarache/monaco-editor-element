class MonacoEditor extends HTMLElement {

    createdCallback () {
        this.defaults = {
            language: 'javascript',
            value: '',
            lineNumbers: true,
            readOnly: false,
            namespace: 'node_modules/monaco-editor/min/vs'
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
        this.setAttribute('loading', true);
        this.container = document.createElement('div');
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.appendChild(this.container);
        require.config({ paths: { 'vs': this._getProperties().namespace }});
        this._loadDependency().then(() => {
            this.editor = monaco.editor.create(this.container, this._getProperties());
            this.removeAttribute('loading');
            this.dispatchEvent(new CustomEvent('ready', { bubbles: true }));
        });
    }

    /**
        * Uses requirejs to load the editor. Stores the promise of the first load, and returns it
        * to the subsequent ones
        */
    _loadDependency () {
        if (!MonacoEditor._loadingPromise) {
            MonacoEditor._loadingPromise = new Promise((resolve, reject) => {
                require(['vs/editor/editor.main'], resolve);
            });
        }
        return MonacoEditor._loadingPromise;
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
            delete this.properties[name];
        } else {
            this.properties[name] = value;
        }
        this._updateOptions();
    }

    _getInitialValues () {
        this.properties = {
            namespace: this.getAttribute('namespace'),
            value: this.getAttribute('value'),
            theme: this.getAttribute('theme'),
            language: this.getAttribute('language'),
            readOnly: (this.getAttribute('read-only') !== null),
            lineNumbers: (this.getAttribute('no-line-numbers') === null)
        }
        Object.keys(this.properties).forEach(key => {
            if (this.properties[key] === null) {
                delete this.properties[key];
            }
        });
    }

    _updateOptions () {
        this.editor.updateOptions(this._getProperties());
    }

    _updateValue () {
        this.editor.setValue(this._getProperties().value);
    }

    _getProperties () {
        return Object.assign({}, this.defaults, this.properties);
    }

    updateOptions (opts) {
        Object.assign(this.properties, opts);
        this._updateOptions();
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

