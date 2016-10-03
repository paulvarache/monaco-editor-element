'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var MonacoEditor = function (_HTMLElement) {
    _inherits(MonacoEditor, _HTMLElement);

    function MonacoEditor() {
        _classCallCheck(this, MonacoEditor);

        return _possibleConstructorReturn(this, (MonacoEditor.__proto__ || Object.getPrototypeOf(MonacoEditor)).apply(this, arguments));
    }

    _createClass(MonacoEditor, [{
        key: 'createdCallback',
        value: function createdCallback() {
            this.defaults = {
                language: 'javascript',
                value: '',
                lineNumbers: true,
                readOnly: false,
                namespace: 'node_modules/monaco-editor/min/vs'
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

            this.setAttribute('loading', true);
            this.container = document.createElement('div');
            this.container.style.width = '100%';
            this.container.style.height = '100%';
            this.appendChild(this.container);
            require.config({ paths: { 'vs': this._getProperties().namespace } });
            this._loadDependency().then(function () {
                _this2.editor = monaco.editor.create(_this2.container, _this2._getProperties());
                _this2.removeAttribute('loading');
                _this2.dispatchEvent(new CustomEvent('ready', { bubbles: true }));
            });
        }

        /**
            * Uses requirejs to load the editor. Stores the promise of the first load, and returns it
            * to the subsequent ones
            */

    }, {
        key: '_loadDependency',
        value: function _loadDependency() {
            if (!MonacoEditor._loadingPromise) {
                MonacoEditor._loadingPromise = new Promise(function (resolve, reject) {
                    require(['vs/editor/editor.main'], resolve);
                });
            }
            return MonacoEditor._loadingPromise;
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
                delete this.properties[name];
            } else {
                this.properties[name] = value;
            }
            this._updateOptions();
        }
    }, {
        key: '_getInitialValues',
        value: function _getInitialValues() {
            var _this3 = this;

            this.properties = {
                namespace: this.getAttribute('namespace'),
                value: this.getAttribute('value'),
                theme: this.getAttribute('theme'),
                language: this.getAttribute('language'),
                readOnly: this.getAttribute('read-only') !== null,
                lineNumbers: this.getAttribute('no-line-numbers') === null
            };
            Object.keys(this.properties).forEach(function (key) {
                if (_this3.properties[key] === null) {
                    delete _this3.properties[key];
                }
            });
        }
    }, {
        key: '_updateOptions',
        value: function _updateOptions() {
            this.editor.updateOptions(this._getProperties());
        }
    }, {
        key: '_updateValue',
        value: function _updateValue() {
            this.editor.setValue(this._getProperties().value);
        }
    }, {
        key: '_getProperties',
        value: function _getProperties() {
            return Object.assign({}, this.defaults, this.properties);
        }
    }, {
        key: 'updateOptions',
        value: function updateOptions(opts) {
            Object.assign(this.properties, opts);
            this._updateOptions();
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
