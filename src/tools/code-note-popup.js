YUI.add('cn-code-note-popup', function (Y) {

	var TEMPLATE = '<div id="codenote" class="yui3-skin-sam">' +
		'<div id="codenote" class="code-note">' +
		    '<h3 class="cn-head">Code Note</h3>' +
		    '<form class="forms cn-form">' +
		      '<fieldset>' +
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
		      '</fieldset>' +
		      '<fieldset>' +
		      '<label>' +
		        '<input type="text" id="cn-tags" name="tags" placeholder="Tags" class="width-100" />' +
		      '</label>' +
		      '<div id="cn-selected-tags">' +
		      '</div>' +
		    '</fieldset>' +
		    '</form>' +
		    '<div class="units-row">' +
		      '<button id="cn-save-btn" class="btn width-40">Save</button>' +
		      '<button id="cn-cancel-btn" class="btn width-50">Cancel</button>' +
		    '</div>' +
		'</div>' +
		'</div>',
		TAG_TEMPLATE = '<button class="btn btn-small btn-green cn-tag">{tag}</button>',
		MESSSAGE_TEMPLATE = '<div class="yui3-skin-sam code-note">{message}</div>';

	Y.namespace('CN').Popup = Y.Base.create('cn-code-note-popup', Y.Base, [], {

		_panel: null,
		_select: null,
		_btnSave: null,
		_inputTitle: null,
		_inputSearch: null,
		_inputTags: null,
		_blockTags: null,
		_btnClear: null,

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

			panel.hide();
			html.appendChild(panel);
		},

		initUI: function (credentials, codeBlocks, processor, callback) {
			var self = this,
				evernoteStorage = new Y.CN.Evernote.Storage({ noteStoreURL: credentials.note_store_url, authenticationToken: credentials.oauth_token }),
				tags = [],
				selectedTags = {};

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
			});

			evernoteStorage.listTags(function (list) {
				Y.Array.each(list, function (tag) {
					tags.push(tag);
				});
			});


			self._select.on('change', function (event) {
				var guid = event.target.get('value');

				evernoteStorage.setNotebook(guid);	
			});

			self._inputSearch.plug(Y.Plugin.AutoComplete, {
				resultHighlighter: 'phraseMatch',
				// resultFilters: 'phraseMatch',
				resultTextLocator: 'title',
				source: function (query, callback) {
					evernoteStorage.findNotes(query, callback);
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

			self._btnSave.on('click', function (event) {
				var selectedBlocks = codeBlocks.filter('.cn-selected'),
					note = Y.Node.create('<div></div>'),
					pack;

				selectedBlocks.each(function (node) {
					var cloneNode = node.cloneNode(true);

					Y.CN.CSSInliner.toInline(cloneNode);
					cloneNode.removeAttribute('selected');
					note.appendChild(cloneNode);

					node.removeClass('cn-selected');
					node.removeClass('cn-marked');
					node.setHTML(Y.CN.Cache.Node[node._yuid]);
					node.detach();
				});

				evernoteStorage.save(note.getHTML(), function (note) {
					Y.log(note);
					self.showOkMessage();
				});
				
				if (Y.Lang.isFunction (callback)) {
					callback();
				}
			});
		},

		showOkMessage: function () {
			var html = Y.one('html'),
				panel = Y.Node.create(Y.Lang.sub(MESSSAGE_TEMPLATE, { message: 'Success!' }));
			html.appendChild(panel);
			
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

		showErrorMessage: function () {

		},

		show: function () {
			this._panel.show();
		},

		hide: function () {
			this._panel.hide();
		},

		reset: function () {
			this._inputTags.removeAttribute('disabled');
			this._select.removeAttribute('disabled');

			this._select.empty();
			this._inputSearch.set('value', '');
			this._inputTitle.set('value', '');
			this._inputTags.set('value', '');
			// this._inputTags.ac.set('source', []);
			this._blockTags.empty();
			this._btnSave.detach();
			this._btnClear.detach();
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