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
        content = content.replace(/\sid="[\s|\w]*"/g, '');
        content = content.replace(/\sclass="[\s|\w|-]*"/g, '');
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
        if (entry.response !== config.authenticationToken) {
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