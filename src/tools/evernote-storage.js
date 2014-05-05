YUI.add('evernote-storage', function (Y) {

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

  Y.namespace('CN.Evernote').Storage = Y.Base.create('cn-evernote-storage', Y.Base, [], {
    _TEMPLATE_EN: '<?xml version="1.0" encoding="UTF-8"?>' +
                '<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">' +
                '<en-note>{content}</en-note>',

    _noteStoreURL: null,
    _authenticationToken: null,
    _noteStoreTransport: null,
    _noteStoreProtocol: null,
    _noteStore: null,

    /* TODO: add clearing tags in according to the enml2.dtd */
    _clearContent: function (content) {
        content = content.replace(/id="[\s|\w]*"/g, '');
        content = content.replace(/class="[\s|\w|-]*"/g, '');
        content = content.replace(/<\/code>/g, '</span>');
        content = content.replace(/<code/g, '<span');
        content = content.replace(/<td [\w|=|\"|\s]*">/g, '<td>');
        content = content.replace(/<table [\w|=|\"|\s]*>/g, '<table>');
        content = content.replace(/<br>/g, '</br>');
        content = content.replace(/cn-style_/g, 'style');

        return content;
    },


    initializer: function (config) {
      this._noteStoreURL = config.noteStoreURL,
      this._authenticationToken = config.authenticationToken,
      this._noteStoreTransport = new Thrift.BinaryHttpTransport(this._noteStoreURL);
      this._noteStoreProtocol = new Thrift.BinaryProtocol(this._noteStoreTransport);
      this._noteStore = new NoteStoreClient(this._noteStoreProtocol);

      this.set('note', new Y.CN.Evernote.Note());
    },

    listNotebooks: function (callback) {
      var self = this;

      self._noteStore.listNotebooks(self._authenticationToken, function (notebooks) {
          Y.log(notebooks);
          callback(notebooks);
        },
        function onerror(error) {
          Y.log(error);
        }
      );
    },

    listTags: function (callback) {
      var self = this;

      self._noteStore.listTags(self._authenticationToken, function (tags) {
        Y.log(tags);
        callback(tags);
      },
      function onerror(error) {
        Y.log(error);
      });
    },

    findNotes: function (query, callback) {
      var self = this,
          filter = new NoteFilter(),
          resultSpec = new NotesMetadataResultSpec();

      filter.words = query;
      filter.inactive = false;
      resultSpec.includeTitle = true;

      self._noteStore.findNotesMetadata(self._authenticationToken, filter, 0, 10, resultSpec, 
        function (result) {
          Y.log(result);
          callback(result.notes);
        },
        function onerror(error) {
          Y.log(error);
        });
    },

    getNoteByGUID: function (guid) {
      var self = this,
          newNote;

      self._noteStore.getNote(self._authenticationToken, guid, true, false, false, false,
        function (resultNote) {
          Y.log("Found Note: " + resultNote);
          newNote = new Y.CN.Evernote.Note({
            guid: resultNote.guid,
            title: resultNote.title,
            content: resultNote.content
          });
          self.set('note', newNote);
        },
        function onerror(error) {
          Y.log(error);
        });
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

    save: function (content, callback) {
      var note = this.get('note'),
          guid = note.get('guid');

      if (Y.Lang.isString(guid) && (guid.length > 0)) {
        this.update(content, callback);
      } else {
        this.create(content, callback);
      }
    },

    update: function (content, callback) {
      var note = this.get('note'),
          enNote = new Note(),
          resultContent = note.get('content').slice(0, -10); //delete '</en-note>' at the end of the content

      enNote.guid = note.get('guid');
      enNote.title = note.get('title');

      resultContent += this._clearContent(content) + '</en-note>';
      enNote.content = resultContent;

      this._noteStore.updateNote(this._authenticationToken, enNote, function (err, note) {
        if (err) {
          // Something was wrong with the note data
          // See EDAMErrorCode enumeration for error code explanation
          // http://dev.evernote.com/documentation/reference/Errors.html#Enum_EDAMErrorCode
          Y.log(err);
          Y.log(note);
        } else {
          callback(note);
        }
      });
    },

    create: function (content, callback) {
      var note = this.get('note'),
          enNote = new Note(),
          title = note.get('title'),
          resultContent;

      enNote.notebookGuid = note.get("notebook");
      enNote.title = (title.length > 0) ? title : 'Untitled';
      enNote.tagGuids = note.get('tags');
      
      resultContent = Y.Lang.sub(this._TEMPLATE_EN, { content: content });
      resultContent = this._clearContent(resultContent);
      enNote.content = resultContent;

      this._noteStore.createNote(this._authenticationToken, enNote, function (err, note) {
        if (err) {
          // Something was wrong with the note data
          // See EDAMErrorCode enumeration for error code explanation
          // http://dev.evernote.com/documentation/reference/Errors.html#Enum_EDAMErrorCode
          Y.log(err);
          Y.log(note);
        } else {
          callback(note);
        }
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
    'base'
  ]
});