YUI.add('evernote-storage', function (Y) {

  Y.namespace('CN.Evernote').Note = Y.Base.create('cn-evernote-note', Y.Base, [], {

  }, {
    ATTRS: {
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
          value: null
        }
    }
  });

  Y.namespace('CN.Evernote').Storage = Y.Base.create('cn-evernote-storage', Y.Base, [], {
    noteStoreURL: null,
    authenticationToken: null,
    noteStoreTransport: null,
    noteStoreProtocol: null,
    noteStore: null,


    initializer: function (config) {
      this.noteStoreURL = config.noteStoreURL,
      this.authenticationToken = config.authenticationToken,
      this.noteStoreTransport = new Thrift.BinaryHttpTransport(this.noteStoreURL);
      this.noteStoreProtocol = new Thrift.BinaryProtocol(this.noteStoreTransport);
      this.noteStore = new NoteStoreClient(this.noteStoreProtocol);

      this.set('note', new Y.CN.Evernote.Note());
    },

    listNotebooks: function (callback) {
      var self = this;

      self.noteStore.listNotebooks(self.authenticationToken, function (notebooks) {
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

      self.noteStore.listTags(self.authenticationToken, function (tags) {
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

      self.noteStore.findNotesMetadata(self.authenticationToken, filter, 0, 10, resultSpec, 
        function (result) {
          Y.log(result);
          callback(result.notes);
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
          enNote = new Note(),
          title = note.get('title')

      enNote.notebookGuid = note.get("notebook");
      enNote.title = (title.length > 0) ? title : 'Untitled';
      enNote.tagGuids = note.get('tags');
      enNote.content = content;

      this.noteStore.createNote(this.authenticationToken, enNote, function (err, note) {
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