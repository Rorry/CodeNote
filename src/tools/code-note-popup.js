YUI.add('cn-code-note-popup', function (Y) {

	var TEMPLATE = '<div id="codenote" class="yui3-skin-code-note">' +
		'<div class="code-note">' +
		    '<h3 class="cn-head">Code Note</h3>' +
		    '<form class="forms cn-form">' +
		      '<label>' +
		        '<div class="input-groups width-100">' +
		          '<input type="text" id="cn-search" name="search" placeholder="Search"><span id="cn-clear-search" class="input-append clear-search">X</span>' +
		        '</div>' +
		        '<div class="forms-desc">Search by title</div>' +
		      '</label>' +
		      '<label>' +
		        '<input type="text" id="cn-title" name="title" placeholder="Title" class="width-100" />' +
		      '</label>' +
		      '<label>' +
		        '<select id="cn-notebook" class="width-100"></select>' +
		      '</label>' +
		      '<label>' +
		        '<input type="text" id="cn-tags" name="tags" placeholder="Tags" class="width-100" />' +
		      '</label>' +
		      '<div class="cn-tags">' +
		      '<div id="cn-selected-tags">' +
		      '</div>' +
		      '</div>' +
		    '</form>' +
		    '<div class="units-row">' +
		      '<div class="unit-50"><button id="cn-save-btn" class="btn">Save</button></div>' +
		      '<div class="unit-50"><button id="cn-cancel-btn" class="btn">Cancel</button></div>' +
		    '</div>' +
		'</div>' +
		'</div>',
		TAG_TEMPLATE = '<button class="btn btn-small btn-white btn-outline cn-tag">{tag}</button>',
		MESSSAGE_TEMPLATE = '<div id="codenote">' + 
		'<div class="code-note-message"><h4 class="cn-head"><strong>{message}</strong></h4></div></div>';

	Y.namespace('CN').Popup = Y.Base.create('cn-code-note-popup', Y.Base, [], {

		_panel: null,
		_select: null,
		_btnSave: null,
		_inputTitle: null,
		_inputSearch: null,
		_inputTags: null,
		_blockTags: null,
		_btnClear: null,
		_btnCancel: null,

		initializer: function (config) {
			var html = Y.one('html'),
				panel = Y.Node.create(TEMPLATE);
			
			this._panel		  = panel;
			this._select	  = panel.one('#cn-notebook');
			this._btnSave 	  = panel.one('#cn-save-btn');
			this._inputTitle  = panel.one('#cn-title');
			this._inputSearch = panel.one('#cn-search');
			this._blockTags   = panel.one('#cn-selected-tags');
			this._inputTags	  = panel.one('#cn-tags');
			this._btnClear    = panel.one('#cn-clear-search');
			this._btnCancel   = panel.one('#cn-cancel-btn');

			panel.hide();
			html.appendChild(panel);
		},

		initUI: function (credentials, codeBlocks, callback) {
			var self = this,
				evernoteStorage = new Y.CN.Evernote.Storage({ noteStoreURL: credentials.note_store_url, authenticationToken: credentials.oauth_token }),
				_error = function (err) {
					self.showErrorMessage(err);
				};

			self._initTags(evernoteStorage);

			evernoteStorage.listNotebooks(function (list) {
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
					evernoteStorage.findNotes(query, callback, _error);
				},
				on: {
					select: function (event) {
						var selectedNote = event.result.raw;
						evernoteStorage.getNoteByGUID(selectedNote.guid);

						self._inputTitle.set('value', selectedNote.title);
						self._inputTags.setAttribute('disabled', 'disabled');
						self._select.setAttribute('disabled', 'disabled');
					}
				}
			});

			self._btnClear.on('click', function (event) {
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

			self._btnSave.on('click', function (event) {
				self._doSave(evernoteStorage, codeBlocks, callback);
			});		

			self._btnCancel.on('click', function (event) {
				callback();
			});
		},

		_initTags: function (evernoteStorage) {
			var self = this,
				tags = [],
				selectedTags = {};

			evernoteStorage.listTags(function (list) {
				Y.Array.each(list, function (tag) {
					tags.push(tag);
				});
			}, function (err) {
				self.showErrorMessage(err);
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
					};

					callback(newTags);
				},
				on: {
					select: function (event) {
						var eTag = event.result.raw,
							tagButton = Y.Node.create(Y.Lang.sub(TAG_TEMPLATE, {tag: eTag.name}));

						selectedTags[eTag.guid] = eTag.name;
						evernoteStorage.addTag(eTag.guid);
						
						self._blockTags.appendChild(tagButton);
						tagButton.on('click', function (event) {
							delete selectedTags[eTag.guid];
							evernoteStorage.removeTag(eTag.guid);
							self._blockTags.removeChild(this);
						}, tagButton);
					}
				}
			});
		},

		_doSave: function (evernoteStorage, codeBlocks, callback) {
			var self = this,
				selectedBlocks = codeBlocks.filter('.cn-selected'),
				note = Y.Node.create('<div></div>'),
				pack;

			selectedBlocks.each(function (node) {
				var cloneNode = node.cloneNode(true);

				Y.CN.CSSInliner.toInline(cloneNode);
				cloneNode.removeAttribute('selected');
				note.appendChild(cloneNode);
			});

			evernoteStorage.save(note.getHTML(), function (note) {
				Y.log(note);
				self.showOkMessage();
			}, function (err) {
				self.showErrorMessage(err);
			});
			
			if (Y.Lang.isFunction (callback)) {
				callback();
			}
		},

		_hideMessage: function (panel) {
			Y.later(3 * 1000, this, function () {
                var anim = new Y.Anim({
                    node    : panel,
                    duration: 2,
                    to      : {
                        opacity: 0
                    },
                    after   : {
                        end: function (event) {
                            panel.remove(true);
                        }
                    }
                });
                anim.run();
            });
		},

		showOkMessage: function () {
			var html = Y.one('html'),
				panel = Y.Node.create(Y.Lang.sub(MESSSAGE_TEMPLATE, { message: 'Success!' }));
			html.appendChild(panel);		
			
			this._hideMessage(panel);
		},

		showErrorMessage: function (error) {
			var html = Y.one('html'),
				panel = Y.Node.create(Y.Lang.sub(MESSSAGE_TEMPLATE, { message: 'Error! ' + (error.message || '') }));
			html.appendChild(panel);
			
			this._hideMessage(panel);
		},

		show: function () {
			this._panel.show();
		},

		hide: function () {
			this._panel.hide();
		},

		reset: function () {
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
			this._btnCancel.detach();
		}

	}, {
		ATTRS: {
			
		}
	});

}, '1.0', {
	requires: [
		'node',
		'anim-base',
		'autocomplete',
		'autocomplete-highlighters',
		'autocomplete-filters',
		'evernote-storage',
		'cn-css-inliner'
	]
});