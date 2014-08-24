/**
 * @module cn-css-inliner 
 */
YUI.add('cn-css-inliner', function (Y) {

  /**
   * A array of CSS selectors and styles.
   * 
   * @property _ideaCSS
   * @type Array
   * @private 
   */
  var _ideaCSS = [
    {
      key: '.hljs',
      value: 'display: block; padding: 0.5em;' +
            'color: #000;' +
            'background: #fff;'
    },
    {
      key: '.hljs-subst,' +
        '.hljs-title',
      value: 'font-weight: normal;' +
            'color: #000;'
    },
    {
      key: '.hljs-comment,' +
          '.hljs-template_comment,' +
          '.hljs-javadoc,' +
          '.diff .hljs-header',
      value: 'color: #808080;' +
            'font-style: italic;'
    },
    {
      key: '.hljs-annotation,' +
          '.hljs-decorator,' +
          '.hljs-preprocessor,' +
          '.hljs-pragma,' +
          '.hljs-doctype,' +
          '.hljs-pi,' +
          '.hljs-chunk,' +
          '.hljs-shebang,' +
          '.apache .hljs-cbracket,' +
          '.hljs-prompt,' +
          '.http .hljs-title',
      value: 'color: #808000;'
    },
    {
      key: '.hljs-tag,' +
          '.hljs-pi',
      value: 'background: #efefef;'
    },
    {
      key: '.hljs-tag .hljs-title,' +
          '.hljs-id,' +
          '.hljs-attr_selector,' +
          '.hljs-pseudo,' +
          '.hljs-literal,' +
          '.hljs-keyword,' +
          '.hljs-hexcolor,' +
          '.css .hljs-function,' +
          '.ini .hljs-title,' +
          '.css .hljs-class,' +
          '.hljs-list .hljs-title,' +
          '.clojure .hljs-title,' +
          '.nginx .hljs-title,' +
          '.tex .hljs-command,' +
          '.hljs-request,' +
          '.hljs-status',
      value: 'font-weight: bold;' +
            'color: #000080;'
    },
    {
      key: '.hljs-attribute,' +
          '.hljs-rules .hljs-keyword,' +
          '.hljs-number,' +
          '.hljs-date,' +
          '.hljs-regexp,' +
          '.tex .hljs-special',
      value: 'font-weight: bold;' +
            'color: #0000ff;'
    },
    {
      key: '.hljs-number,' +
          '.hljs-regexp',
      value: 'font-weight: normal;'
    },
    {
      key: '.hljs-string,' +
          '.hljs-value,' +
          '.hljs-filter .hljs-argument,' +
          '.css .hljs-function .hljs-params,' +
          '.apache .hljs-tag',
      value: 'color: #008000;' +
            'font-weight: bold;'
    },
    {
      key: '.hljs-symbol,' +
          '.ruby .hljs-symbol .hljs-string,' +
          '.hljs-char,' +
          '.tex .hljs-formula',
      value: 'color: #000;' +
            'background: #d0eded;' +
            'font-style: italic;'
    },
    {
      key: '.hljs-phpdoc,' +
          '.hljs-yardoctag,' +
          '.hljs-javadoctag',
      value: 'text-decoration: underline;'
    },
    {
      key: '.hljs-variable,' +
          '.hljs-envvar,' +
          '.apache .hljs-sqbracket,' +
          '.nginx .hljs-built_in',
      value: 'color: #660e7a;'
    },
    {
      key: '.hljs-addition',
      value: 'background: #baeeba;'
    },
    {
      key: '.hljs-deletion',
      value: 'background: #ffc8bd;'
    },
    {
      key: '.diff .hljs-change',
      value: 'background: #bccff9;'
    }
  ];

  /**
   * A simple class for converting styles of the highlighting from the array styles to inline styles
   *
   * @class CSSInliner
   * @namespace CN
   * @static
   */
  Y.namespace('CN').CSSInliner = (function () {
    var _toInline = function (node) {
        Y.Array.each(_ideaCSS, function (rule) {
          node.all(rule.key).each(function (elem) {
            var style = elem.getAttribute('cn-style_') + rule.value;
            /* a specific attribute cn-style for storing string styles without calculating by browsers */
            elem.setAttribute('cn-style_', style);
            elem.removeAttribute('class');
            elem.removeAttribute('style'); //remove old inline styles
          });
        });
      };

    return {
      toInline: _toInline
    };
  }) ();

}, '1.0', {
  requires: [
  ]
});
/**
 * The module provides classes to work with the evernote API.
 *
 * @module 'cn-evernote-storage'
 * */
YUI.add('cn-evernote-storage', function (Y) {

  /** cache keys */
  var EVERNOTE_COLLECTIONS = 'evernote_collections',
      OAUTH_TOKEN = 'oauth_token',
      NOTEBOOKS = 'notebooks',
      TAGS = 'tags',

      CACHE_EXPIRES = 5 * 60 * 1000;

  /**
   * The class emulates the evernote note.
   *
   * @class Note
   * @namespace CN.Evernote
   * @constructor
   * */
  Y.namespace('CN.Evernote').Note = Y.Base.create('cn-evernote-note', Y.Base, [], {

  }, {
    ATTRS: {
        guid: {
          value: null,
          validator: Y.Lang.isString
        },
        title: {
          value: '',
          validator: Y.Lang.isString
        },
        notebook: {
          value: null
        },
        tags: {
          value: [],
          validator: Y.Lang.isArray
        },
        content: {
          value: null,
          validator: Y.Lang.isString
        }
    }
  });

  /**
   * The class represents a layer between the extension and the evernote API.
   * This class provides methods to work with the evernote API.
   *
   * The Storage class uses the Note class as representation the note in the evernote.
   *
   * Before saving to the evernote all selected code need to prepare in according to the enml2.dtd.
   *
   * @class Storage
   * @namespace CN.Evernote
   * @constructor
   * */
  Y.namespace('CN.Evernote').Storage = Y.Base.create('cn-evernote-storage', Y.Base, [], {
    _TEMPLATE_EN: '<?xml version="1.0" encoding="UTF-8"?>' +
                '<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">' +
                '<en-note>{content}</en-note>',

    _cache: null,

    _noteStoreURL: null,
    _authenticationToken: null,
    _noteStoreTransport: null,
    _noteStoreProtocol: null,
    _noteStore: null,

    /* TODO: add clearing tags in according to the enml2.dtd */
    _clearContent: function (content) {
        content = content.replace(/id="[\s|\w]*"/g, '');
        content = content.replace(/class="[\s|\w|-]*"/g, '');
        // content = content.replace(/<\/code>/g, '</span>');
        // content = content.replace(/<code/g, '<span');
        content = content.replace(/<td [\w|=|\"|\s]*">/g, '<td>');
        content = content.replace(/<table [\w|=|\"|\s]*>/g, '<table>');
        content = content.replace(/<br>/g, '</br>');
        content = content.replace(/cn-style_/g, 'style');

        return content;
    },


    initializer: function (config) {
      var entry;

      this._noteStoreURL = config.noteStoreURL;
      this._authenticationToken = config.authenticationToken;
      this._noteStoreTransport = new Thrift.BinaryHttpTransport(this._noteStoreURL);
      this._noteStoreProtocol = new Thrift.BinaryProtocol(this._noteStoreTransport);
      this._noteStore = new NoteStoreClient(this._noteStoreProtocol);

      this.set('note', new Y.CN.Evernote.Note());

      this._cache = new Y.CacheOffline({ sandbox: EVERNOTE_COLLECTIONS, expires: CACHE_EXPIRES });

      entry = this._cache.retrieve(OAUTH_TOKEN);
      if (entry) {
        if (entry.response != config.authenticationToken) {
          this._cache.flush();
        }
      }
    },

    clearNote: function () {
      this.set('note', new Y.CN.Evernote.Note());
    },

    setNotebook: function (notebook) {
      var note = this.get('note');

      note.set('notebook', notebook);
    },

    setTitle: function (title) {
      var note = this.get('note');

      note.set('title', title);
    },

    addTag: function (tag) {
      var note = this.get('note');

      note.get('tags').push(tag);
    },

    removeTag: function (tag) {
      var note = this.get('note'),
        tags = note.get('tags'),
        index = tags.indexOf(tag);

      if (index > -1) {
        tags.splice(index, 1);
      }
    },

    notebooksPromise: function () {
      var self = this;

      return new Y.Promise(function (resolve, reject) {
        var entry = self._cache.retrieve(NOTEBOOKS);

        if (entry) {
          resolve(entry.response);
        } else {
          self._noteStore.listNotebooks(self._authenticationToken, function (notebooks) {
              Y.log(notebooks);
              self._cache.add(NOTEBOOKS, notebooks);
              resolve(notebooks);
            },
            function onerror(error) {
              Y.log(error);
              reject(error);
            }
          );
        }
      });
    },

    tagsPromise: function () {
      var self = this;

      return new Y.Promise(function (resolve, reject) {
        var entry = self._cache.retrieve(TAGS);

        if (entry) {
          resolve(entry.response);
        } else {
          self._noteStore.listTags(self._authenticationToken, function (tags) {
            Y.log(tags);
            self._cache.add(TAGS, tags);
            resolve(tags);
          }, function onerror(error) {
            Y.log(error);
            reject(error);
          });
        }
      });
    },

    searchNotesPromise: function (query) {
      var self = this;

      return new Y.Promise(function (resolve, reject) {
        var filter = new NoteFilter(),
          resultSpec = new NotesMetadataResultSpec();

        filter.words = query;
        filter.inactive = false;
        resultSpec.includeTitle = true;

        self._noteStore.findNotesMetadata(self._authenticationToken, filter, 0, 10, resultSpec,
          function (result) {
            Y.log(result);
            resolve(result.notes);
          },
          function onerror(error) {
            Y.log(error);
            reject(error);
          });
      });
    },

    setNotePromise: function (guid) {
      var self = this;

      return new Y.Promise(function (resolve, reject) {
        var newNote;

        self._noteStore.getNote(self._authenticationToken, guid, true, false, false, false,
          function (resultNote) {
            newNote = new Y.CN.Evernote.Note({
              guid: resultNote.guid,
              title: resultNote.title,
              content: resultNote.content
            });
            self.set('note', newNote);
            resolve(resultNote);
          },
          function onerror(error) {
            Y.log(error);
            reject(error);
          });
      });
    },

    savePromise: function (content) {
      var note = this.get('note'),
        guid = note.get('guid'),
        resultPromise;

      if (Y.Lang.isString(guid) && (guid.length > 0)) {
        resultPromise = this.updatePromise(content);
      } else {
        resultPromise = this.createPromise(content);
      }

      return resultPromise;
    },

    updatePromise: function (content) {
      var self = this;

      return new Y.Promise(function (resolve, reject) {
        var note = self.get('note'),
          enNote = new Note(),
          resultContent = note.get('content').slice(0, -10); //delete '</en-note>' at the end of the content

        enNote.guid = note.get('guid');
        enNote.title = note.get('title');

        resultContent += self._clearContent(content) + '</en-note>';
        enNote.content = resultContent;

        self._noteStore.updateNote(self._authenticationToken, enNote, function (note) {
          resolve(note);
        }, function onerror(err) {
          // Something was wrong with the note data
          // See EDAMErrorCode enumeration for error code explanation
          // http://dev.evernote.com/documentation/reference/Errors.html#Enum_EDAMErrorCode
          Y.log(err);
          reject(err);
        });
      });
    },

    createPromise: function (content) {
      var self = this;

      return new Y.Promise(function (resolve, reject) {
        var note = self.get('note'),
          enNote = new Note(),
          title = note.get('title'),
          resultContent;

        enNote.notebookGuid = note.get("notebook");
        enNote.title = (title.length > 0) ? title : 'Untitled';
        enNote.tagGuids = note.get('tags');

        resultContent = Y.Lang.sub(self._TEMPLATE_EN, { content: content });
        resultContent = self._clearContent(resultContent);
        enNote.content = resultContent;

        self._noteStore.createNote(self._authenticationToken, enNote, function (note) {
          resolve(note);
        }, function onerror(err) {
          // Something was wrong with the note data
          // See EDAMErrorCode enumeration for error code explanation
          // http://dev.evernote.com/documentation/reference/Errors.html#Enum_EDAMErrorCode
          Y.log(err);
          reject(err);
        });
      });
    }

  }, {
    ATTRS: {
      note: {
        value: null
      }
    }
  });      

}, '1.0', {
  requires: [
    'base',
    'promise',
    'cache-offline'
  ]
});
/**
 * The module provides classes for creating a control panel on web pages.
 *
 * @module 'cn-code-note-popup'
 * */
YUI.add('cn-code-note-popup', function (Y) {

  /**
   * A url for the popup template.
   *
   * @property POPUP_TEMPLATE
   * @type String
   */
  var POPUP_TEMPLATE = chrome.extension.getURL('resources/templates/popup.html'),
    /**
     * A url for the message template.
     *
     * @property MESSAGE_TEMPLATE
     * @type String
     */
    MESSAGE_TEMPLATE = chrome.extension.getURL('resources/templates/message.html'),
    /**
     * A string template for tags.
     *
     * @property TAG_TEMPLATE
     * @type String
     */
    TAG_TEMPLATE = '<button class="btn btn-small btn-white btn-outline cn-tag">{tag}</button>';

  /**
   * The component represents a popup on web pages, which appears when users click the extension icon.
   * The popup executes asynchronous loading the <code>POPUP_TEMPLATE</code> template before initialization.
   *
   * @class Popup
   * @namespace CN
   * @constructor
   * */
  Y.namespace('CN').Popup = Y.Base.create('cn-code-note-popup', Y.Base, [], {

    _panel      : null,
    _select     : null,
    _btnSave    : null,
    _inputTitle : null,
    _inputSearch: null,
    _inputTags  : null,
    _blockTags  : null,
    _btnClear   : null,
    _btnCancel  : null,

    _informer   : null,

    initializer: function (config) {
      var self = this,
          callback = config.callback;

      if (callback) {
        self.set('callback', callback);
      }
      
      Y.io(POPUP_TEMPLATE, {
        on: {
          success: function (transactionid, response) {
            var html = Y.one('html'),
              panel = Y.Node.create(response.responseText);

            self._panel       = panel;
            self._select      = panel.one('#cn-notebook');
            self._btnSave     = panel.one('#cn-save-btn');
            self._inputTitle  = panel.one('#cn-title');
            self._inputSearch = panel.one('#cn-search');
            self._blockTags   = panel.one('#cn-selected-tags');
            self._inputTags   = panel.one('#cn-tags');
            self._btnClear    = panel.one('#cn-clear-search');
            self._btnCancel   = panel.one('#cn-cancel-btn');

            self._informer    = new Y.CN.Informer();

            panel.hide();
            html.appendChild(panel);

            if (Y.Lang.isFunction(callback)) {
              self._btnCancel.on('click', function () {
                callback();
              });
            }
          }
        }
      });
    },

    initUI: function (credentials, codeBlocks) {
      var self = this,
        evernoteStorage,
        _error = function (err) {
          self._informer.showErrorMessage(err);
        };

      if (Y.Lang.isValue(self._panel) && Y.Lang.isString(credentials.oauth_token)) {
        evernoteStorage = new Y.CN.Evernote.Storage({ noteStoreURL: credentials.note_store_url, authenticationToken: credentials.oauth_token });

        self._initTags(evernoteStorage);

        evernoteStorage.notebooksPromise().then(function (list) {
          Y.Array.each(list, function (item) {
            var guid = item.guid,
              name = item.name,
              option = Y.Node.create(Y.Lang.sub('<option value="{guid}">{name}</option>', { guid: guid, name: name }));

            if (item.defaultNotebook) {
              evernoteStorage.setNotebook(guid);
              option.set('selected', 'selected');
            }
              
            self._select.appendChild(option);
          });
        }, _error);

        self._select.on('change', function (event) {
          var guid = event.target.get('value');

          evernoteStorage.setNotebook(guid);  
        });

        self._inputSearch.plug(Y.Plugin.AutoComplete, {
          resultHighlighter: 'phraseMatch',
          // resultFilters: 'phraseMatch',
          resultTextLocator: 'title',
          source: function (query, callback) {
            evernoteStorage.searchNotesPromise(query).then(callback, _error);
          },
          on: {
            select: function (event) {
              var selectedNote = event.result.raw;
              evernoteStorage.setNotePromise(selectedNote.guid).then(function (note) {
                self._inputTitle.set('value', note.title);
                self._inputTags.setAttribute('disabled', 'disabled');
                self._select.setAttribute('disabled', 'disabled');
              }, _error);
            }
          }
        });

        self._btnClear.on('click', function () {
          evernoteStorage.clearNote();
          self._inputTitle.set('value', '');
          self._inputSearch.set('value', '');
          self._inputTags.removeAttribute('disabled');
          self._select.removeAttribute('disabled');
        });

        self._inputTitle.on('change', function (event) {
          var title = event.target.get('value');

          evernoteStorage.setTitle(title);
        });

        self._btnSave.on('click', function () {
          self._doSave(evernoteStorage, codeBlocks);
        });
      }
    },

    _initTags: function (evernoteStorage) {
      var self = this;

      evernoteStorage.tagsPromise().then(function (list) {
        var tags = [],
          selectedTags = {};

        Y.Array.each(list, function (tag) {
          tags.push(tag);
        });

        self._inputTags.plug(Y.Plugin.AutoComplete, {
          resultHighlighter: 'phraseMatch',
          resultFilters: 'phraseMatch',
          resultTextLocator: 'name',
          source: function (query, callback) {
            var newTags = [],
              i;
            
            for (i = 0; i < tags.length; i++) {
              if (!(tags[i].guid in selectedTags)) {
                newTags.push(tags[i]);
              }
            }

            callback(newTags);
          },
          on: {
            select: function (event) {
              var eTag = event.result.raw,
                tagButton = Y.Node.create(Y.Lang.sub(TAG_TEMPLATE, {tag: eTag.name}));

              selectedTags[eTag.guid] = eTag.name;
              evernoteStorage.addTag(eTag.guid);
              
              self._blockTags.appendChild(tagButton);
              tagButton.on('click', function () {
                delete selectedTags[eTag.guid];
                evernoteStorage.removeTag(eTag.guid);
                self._blockTags.removeChild(this);
              }, tagButton);
            }
          }
        });
      }, function (err) {
        self._informer.showErrorMessage(err);
      });
    },

    _doSave: function (evernoteStorage, codeBlocks) {
      var self = this,
        callback = this.get('callback'),
        selectedBlocks = codeBlocks.filter('.cn-selected'),
        note = Y.Node.create('<div></div>');

      selectedBlocks.each(function (node) {
        var cloneNode = node.cloneNode(true);

        Y.CN.CSSInliner.toInline(cloneNode);
        cloneNode.removeAttribute('selected');
        note.appendChild(cloneNode);
      });

      self._informer.showLoadingMessage();
      evernoteStorage.savePromise(note.getHTML()).then(function (note) {
        Y.log(note);
        self._informer.showOkMessage();
      }, function (err) {
        self._informer.showErrorMessage(err);
      });
      
      if (Y.Lang.isFunction (callback)) {
        callback();
      }
    },

    show: function () {
      if (Y.Lang.isValue(this._panel)) {
        this._panel.show();
      }
    },

    hide: function () {
      if (Y.Lang.isValue(this._panel)) {
        this._panel.hide();
      }
    },

    reset: function () {
      if (Y.Lang.isValue(this._panel)) {
        // select field
        this._select.removeAttribute('disabled');
        this._select.empty();
        
        // input search field
        this._inputSearch.set('value', '');
        this._inputSearch.unplug(Y.Plugin.AutoComplete);
        this._inputSearch.detach();
        
        // input title field
        this._inputTitle.set('value', '');
        
        // input tags field
        this._inputTags.removeAttribute('disabled');
        this._inputTags.set('value', '');
        this._inputTags.unplug(Y.Plugin.AutoComplete);
        this._inputTags.detach();
        this._blockTags.empty();

        // buttons
        this._btnClear.detach();
        this._btnSave.detach();
      }
    }

  }, {
    ATTRS: {
      callback: {
        value: null,
        validator: Y.Lang.isFunction
      }
    }
  });

  /**
   * The component represents a message container.
   * The message container executes asynchronous loading the <code>MESSAGE_TEMPLATE</code> template before initialization.
   *
   * @class Informer
   * @namespace CN
   * @constructor
   * */
  Y.namespace('CN').Informer = Y.Base.create('cn-code-note-informer', Y.Base, [], {
    _panel: null,
    _messageContainer: null,
    _successIcon: null,
    _errorIcon: null,
    _loadingIcon: null,

    _hideMessage: function () {
      var panel = this._panel;

      Y.later(3 * 1000, this, function () {
        var anim = new Y.Anim({
          node    : panel,
          duration: 2,
          to      : {
            opacity: 0
          },
          after   : {
            end: function () {
              panel.hide();
              panel.setStyle('opacity', 1);
            }
          }
        });
        anim.run();
      });
    },

    initializer: function () {
      var self = this;

      Y.io(MESSAGE_TEMPLATE, {
        on: {
          success: function (transactionid, response) {
            var html = Y.one('html'),
              panel = Y.Node.create(response.responseText);

            self._panel = panel;
            self._messageContainer = panel.one('#cn-message');
            self._successIcon = panel.one('#cn-success-icon');
            self._errorIcon = panel.one('#cn-error-icon');
            self._loadingIcon = panel.one('#cn-loading-icon');

            panel.hide();
            html.appendChild(panel);
          }
        }
      });
    },

    showOkMessage: function () {
      if (Y.Lang.isValue(this._panel)) {
        this._messageContainer.set('text', 'Success!');
        this._successIcon.show();
        this._errorIcon.hide();
        this._loadingIcon.hide();

        this._panel.show();
        this._hideMessage();
      }
    },

    showErrorMessage: function (error) {
      if (Y.Lang.isValue(this._panel)) {
        this._messageContainer.set('text', 'Error!');
        this._successIcon.hide();
        this._errorIcon.show();
        this._loadingIcon.hide();

        this._panel.show();
        this._hideMessage();
      }
    },

    showLoadingMessage: function () {
      if (Y.Lang.isValue(this._panel)) {
        this._messageContainer.set('text', 'Loading...');
        this._successIcon.hide();
        this._errorIcon.hide();
        this._loadingIcon.show();

        this._panel.show();
      }
    }
  }, {
    ATTRS: {

    }
  });

}, '1.0', {
  requires: [
    'node',
    'anim-base',
    'io-base',
    'autocomplete',
    'autocomplete-highlighters',
    'autocomplete-filters',
    'cn-evernote-storage',
    'cn-css-inliner'
  ]
});
YUI.add('cn-code-cleaner', function (Y) {

    Y.namespace('CN').CodeCleaner = Y.Base.create('cn-code-cleaner', Y.Base, [], {
        extractsSourceSpans: function (node, isPreformatted) {
            var nocode = /(?:^|\s)nocode(?:\s|$)/;

            var chunks = [];
            var length = 0;
            var spans = [];
            var k = 0;

            function walk(node) {
                var type = node.nodeType;

                if (type == 1) {  // Element
                    if (nocode.test(node.className)) { return; }
                    for (var child = node.firstChild; child; child = child.nextSibling) {
                        walk(child);
                    }
                    var nodeName = node.nodeName.toLowerCase();
                    if ('br' === nodeName || 'li' === nodeName) {
                        chunks[k] = '\n';
                        spans[k << 1] = length++;
                        spans[(k++ << 1) | 1] = node;
                    }
                } else if (type == 3 || type == 4) {  // Text
                    var text = node.nodeValue;
                    if (text.length) {
                        if (!isPreformatted) {
                            text = text.replace(/[ \t\r\n]+/g, ' ');
                        } else {
                            text = text.replace(/\r\n?/g, '\n');  // Normalize newlines.
                        }
                        // TODO: handle tabs here?
                        chunks[k] = text;
                        spans[k << 1] = length;
                        length += text.length;
                        spans[(k++ << 1) | 1] = node;
                    }
                }
            }

            walk(node);

            return {
                sourceCode: chunks.join('').replace(/\n$/, ''),
                spans: spans
            };
        },

        process: function (node) { //TODO: Написать интеллектуальную чистку кода.
            var formated = this.extractsSourceSpans(node._node, true);

            node.set('text', formated.sourceCode);
        }
    }, {});

}, '1.0', {
    requires: [
        'base',
        'array-extras'
    ]
});



YUI.add('cn-languages', function (Y) {

    Y.namespace('CN.Model').Language = Y.Base.create('cn-model-language', Y.Model, [], {
        getName: function () {
            return this.get('name');
        },

        getAliases: function () {
            return this.get('aliases');
        },

        getKeywords: function () {
            return this.get('keywords');
        }
    }, {
        ATTRS: {
            name: {
                value       : '',
                validator   : Y.Lang.isString,
                readonly    : true
            },
            aliases: {
                value       : [],
                validator   : Y.Lang.isArray,
                readonly    : true
            },
            keywords: {
                value       : [],
                validator   : Y.Lang.isArray,
                readonly    : true
            }
        }
    });

    Y.namespace('CN.Model.List').Language = Y.Base.create('cn-model-list-language', Y.ModelList, [], {
        model: Y.CN.Model.Language
    });

}, '1.0', {
    requires: [
        'model',
        'model-list'
    ]
});



YUI.add('cn-lang-detector', function (Y) {

    Y.namespace('CN').LangDetector = Y.Base.create('cn-lang-detector', Y.Base, [], {
        clean: function (text) {
            var i, ch, lst, pure = '';

            for (i = 0; i < text.length; i++) {
                ch = text.charAt(i);
                if (/[a-zA-Z0-9_]/.test(ch)) {
                    pure += ch;
                    lst = false;
                } else {
                    if (!lst) {
                        pure += ' ';
                        lst = true;
                    }
                }
            }

            return pure;
        },

        freqTable: function (text) {
            var table = {},
                pure = this.clean(text),
                words = pure.split(/[\s]+/);

            Y.Array.each(words, function (word) {
                var val = table[word] || 0;

                table[word] = val + 1;
            });

            return table;
        },

        compare: function (freqTable, keywords) {
            var obj = freqTable || {},
                sum = 0;

            Y.Object.each(freqTable, function (val, key) {
                if (keywords.indexOf(key) < 0) {
                    sum += val * 3;
                }
            });

            return sum;
        },

        guess: function (text) {
            var _sum,
                self  = this,
                _lang = 'js',
                table = this.freqTable(text),
                langs = this.getLanguages();

            Y.Array.each(langs, function (lang) {
                var sum = self.compare(table, lang.keywords);

                if (_sum) {
                    if (sum < _sum) {
                        _sum = sum;
                        _lang = lang.name;
                    }
                } else {
                    _sum = sum;
                    _lang = lang.name;
                }
            });

            return _lang;
        },

        checkLang: function (lang) {
            var _lang = null,
                languages = this.getLanguages();

            languages.each(function (language) {
                var aliases = language.getAliases();

                if (aliases.indexOf(lang) >= 0) {
                    _lang = language.getName();
                }
            });

            return _lang;
        },

        checkNode: function (node) {
            var self   = this,
                _lang  = node && node.getAttribute('lang') || null,
                _class = node && node.getAttribute('class') || null,
                aClasses,
                languages = this.getLanguages();

            if (Y.Lang.isNull(_lang)) {
                if (!Y.Lang.isNull(_class)) {
                    aClasses = _class.split(' ');
                    Y.Array.each(aClasses, function (aClass) {
                        var l = self.checkLang(aClass);
                        if (!Y.Lang.isNull(l)) {
                            _lang = l;
                        }
                    });
                }
            } else {
                _lang = this.checkLang(_lang);
            }

            return _lang;
        },

        check: function (node) {
            var item = node,
                _lang = this.checkNode(item);

            if (Y.Lang.isNull(node)) {
                return null;
            }

            if (Y.Lang.isNull(_lang)) {
                item = node.get('parent');
                if (item) {
                    _lang = this.checkNode(item);
                }
            }

            if (Y.Lang.isNull(_lang)) {
                item = node.one('code');
                if (item) {
                    _lang = this.checkNode(item);
                }
            }

            return _lang;
        },

        process: function (node) {
            var lang;

            if (Y.Lang.isNull(node)) {
                return;
            }

            lang = this.check(node);

            if (!lang) {
                lang = this.guess(node.get('text'));
            }

            node.setAttribute('lang', lang);
        },

        getLanguages: function () { return this.get('languages'); }
    }, {
        ATTRS: {
            languages: {
                valueFn: function () {
                    var langs = new Y.CN.Model.List.Language();

                    langs.add(new Y.CN.Model.Language({
                        name    : 'applescript',
                        aliases : ['applescript']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'as3',
                        aliases : ['as3', 'actionscript3']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'bash',
                        aliases : ['bash', 'shell', 'sh']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'cf',
                        aliases : ['coldfusion', 'cf']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'cpp',
                        aliases : ['cpp', 'cc', 'c++', 'c', 'h', 'hpp', 'h++']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'csharp',
                        aliases : ['c#', 'c-sharp', 'csharp']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'css',
                        aliases : ['css']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'delphi',
                        aliases : ['delphi', 'pascal', 'pas']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'diff',
                        aliases : ['diff', 'patch']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'erlang',
                        aliases : ['erl', 'erlang']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'groovy',
                        aliases : ['groovy']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'haxe',
                        aliases : ['haxe', 'hx']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name: 'java',
                        aliases: ['java'],
                        keywords: [
                            'abstract', 'assert', 'boolean', 'break', 'byte',
                            'case', 'catch', 'char', 'class', 'const',
                            'continue', 'default', 'do', 'double', 'else',
                            'enum', 'extends', 'false', 'final', 'finally',
                            'float', 'for', 'goto', 'if', 'implements',
                            'import', 'instanceof', 'int', 'interface', 'long',
                            'native', 'new', 'null', 'package', 'private',
                            'protected', 'public', 'return', 'short', 'static',
                            'strictfp', 'super', 'switch', 'synchronized', 'this',
                            'throw', 'throws', 'true', 'transient', 'try',
                            'void', 'volatile', 'while'
                        ]
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'javafx',
                        aliases : ['jfx', 'javafx']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'js',
                        aliases : ['js', 'jscript', 'javascript', 'json'],
                        keywords: [
                            'break', 'case', 'catch', 'class', 'continue',
                            'default', 'delete', 'do', 'else', 'enum',
                            'export', 'extends', 'false', 'for', 'function',
                            'if', 'implements', 'import', 'in', 'instanceof',
                            'interface', 'let', 'new', 'null', 'package',
                            'private', 'protected', 'static', 'return', 'super',
                            'switch', 'this', 'throw', 'true', 'try',
                            'typeof', 'var', 'while', 'with', 'yield'
                        ]
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'perl',
                        aliases : ['perl', 'pl']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'php',
                        aliases : ['php']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'plain',
                        aliases : ['text', 'plain']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'powershell',
                        aliases : ['powershell', 'ps', 'posh']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'python',
                        aliases : ['py', 'python']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'ruby',
                        aliases : ['ruby', 'rails', 'ror', 'rb']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'sass',
                        aliases : ['sass', 'scss']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'scala',
                        aliases : ['scala']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'sql',
                        aliases : ['sql']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'tap',
                        aliases : ['tap']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'typescript',
                        aliases : ['typescript', 'ts']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'vb',
                        aliases : ['vb', 'vbnet']
                    }));

                    langs.add(new Y.CN.Model.Language({
                        name    : 'xml',
                        aliases : ['xml', 'xhtml', 'xslt', 'html', 'plist']
                    }));

                    return langs;
                }
            }
        }
    });

}, '1.0', {
    requires: [
        'base',
        'array-extras',
        'cn-languages'
    ]
});



YUI.add('cn-code-formatter', function (Y) {

    Y.namespace('CN').CodeFormatter = Y.Base.create('cn-code-formatter', Y.Base, [], {
        process: function (node) {}
    }, {});

}, '1.0', {
    requires: [
        'base'
    ]
});



YUI.add('cn-highlighter', function (Y) {

    Y.namespace('CN').Highlighter = Y.Base.create('cn-highlighter', Y.Base, [], {
        process: function (node) {
            // var lang = node.getAttribute('lang');
            // node.setAttribute('class', 'brush: ' + lang);
            hljs.highlightBlock(node._node);
        }
    }, {});

}, '1.0', {
    requires: [
        'base'
    ] 
});



YUI.add('cn-code-processor', function (Y) {

    Y.namespace('CN').CodeProcessor = Y.Base.create('cn-code-processor', Y.Base, [], {
        processAll: function (nodeList) {
            var self = this;

            if (nodeList) {
                nodeList.each(function (node) {
                    self.processNode(node);
                });
            }
        },

        processNode: function (node) {
            var lang,
                cc = this.getCodeCleaner(),
                ld = this.getLangDetector(),
                cf = this.getCodeFormatter(),
                sh = this.getHighlighter();

            if (!Y.Lang.isNull(node)) {
                if (ld) { ld.process(node); }
                if (cc) { cc.process(node); }
                if (cf) { cf.process(node); }
                if (sh) { sh.process(node); }
            }
        },

        getCodeCleaner: function () {
            return this.get('codeCleaner');
        },

        getLangDetector: function () {
            return this.get('langDetector');
        },

        getCodeFormatter: function () {
            return this.get('codeFormatter');
        },

        getHighlighter: function () {
            return this.get('hightlighter');
        }
    }, {
        ATTRS: {
            codeCleaner: {
                valueFn: function () {
                    return new Y.CN.CodeCleaner();
                }
            },
            langDetector: {
                valueFn: function () {
                    return new Y.CN.LangDetector();
                }
            },
            codeFormatter: {
                valueFn: function () {
                    return new Y.CN.CodeFormatter();
                }
            },
            hightlighter: {
                valueFn: function () {
                    return new Y.CN.Highlighter();
                }
            }
        }
    });

 }, '1.0', {
    requires: [
        'base',
        'cn-code-cleaner',
        'cn-lang-detector',
        'cn-code-formatter',
        'cn-highlighter'
    ]
});

/**
 * The module provides a starting point to work with the plugin.
 *
 * @module cn-page-listener
 */
YUI.add('cn-page-listener', function (Y) {

  /**
   * The property is state of the Listener class.
   *
   * @property CURRENT_MODE_ON
   * @type {Bool}
   * @public
   */
  var CURRENT_MODE_ON = false;

  /**
   * The object with original cached nodes of code.
   *
   * @property Node
   * @namespace CN.Cache
   * @static
   */
  Y.namespace('CN.Cache').Node = {};

  /**
   * The class listens messages from background.js.
   * The Listener class collects all blocks of code on web page and shows a popup to work with this blocks of code.
   *
   * @class Listener
   * @namespace CN.Page
   * @static
   */
  Y.namespace('CN.Page').Listener = (function () {
    var _METHODS = [
        'init',
        'onAuthorise'
      ],
      _processor = new Y.CN.CodeProcessor(),
      _codeBlocks = new Y.NodeList(),
      _selectedBlocks = new Y.NodeList(),
      _popup = new Y.CN.Popup({
        callback: function () {
          Y.CN.Page.Listener.init(); // emulation the message from background.js
        }
      }),

      /**
       * Collects all blocks of code on web page and caches their.
       *
       * @method _selectBlocks
       * @private
       */
      _selectBlocks = function () {
        var preBlocks = Y.all('pre');

        preBlocks.each(function (block) {
          var clone = block.cloneNode(true),
            node  = Y.Node.create('<div></div>');

          block.replace(node);
          node.setHTML(clone._node);
          Y.CN.Cache.Node[node._yuid] = node.getHTML();
          _codeBlocks.push(node);
        });
      },

      /**
       * Executes highlighting collected code blocks and shows\hides popup in according to state CURRENT_MODE_ON
       *
       * @method _init
       * @private
       */
      _init = function () {

        if (CURRENT_MODE_ON) { // turn off
          var nodes = Y.all('.cn-marked');

          nodes.each(function (node) {
            node.removeAttribute('selected');
            node.removeClass('cn-selected');
            node.removeClass('cn-marked');
            node.setHTML(Y.CN.Cache.Node[node._yuid]);
            node.detach();            
          });

          _popup.reset();
          _popup.hide();
        } else { // turn on
          if (_codeBlocks.isEmpty()) { // first time
            _selectBlocks();
          }

          _codeBlocks.each(function (node) {
            node.addClass('cn-marked');

            node.on('click', function (event) {
              var pre;

              if (this.getAttribute('selected')) {
                this.removeClass('cn-selected');
                this.removeAttribute('selected');
                this.setHTML(Y.CN.Cache.Node[this._yuid]);
              } else {
                pre = this.one('pre');
                this.addClass('cn-selected');
                this.setAttribute('selected');
                _processor.processNode(pre);  
              }
            }, node);
          });

          _popup.show();
        }
        CURRENT_MODE_ON = !CURRENT_MODE_ON;
      },

      /**
       * Executes popup initialization after authorization message
       *
       * @method _onAuthorise
       * @private
       */
      _onAuthorise = function (credentials) {
        if (CURRENT_MODE_ON) { // a message of authorization after the message of initialization
//          Y.log('<- success authorise: ' + credentials);
          _popup.initUI(credentials, _codeBlocks);
        }
      };
    
    return {
      METHODS: _METHODS,
      init: _init,
      onAuthorise: _onAuthorise
    };
  })();

}, '1.0', {
  requires: [
    'node',
    'cn-code-processor',
    'cn-code-note-popup'
  ]
});

YUI({ lang: "en" }).use('cn-page-listener', function (Y) {

  chrome.extension.onConnect.addListener(function(port) {
      port.onMessage.addListener(function (obj) {
        if (obj.method && Y.Lang.isString(obj.method) && (Y.CN.Page.Listener.METHODS.indexOf(obj.method) > -1)) {
          Y.CN.Page.Listener[obj.method](obj.data);
//          port.postMessage({method: obj.method + ' back!'});
        }
      });
  });

});