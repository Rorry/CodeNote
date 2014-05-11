YUI.add('cn-code-note-popup', function (Y) {

	var TEMPLATE = '<div class="code-note-cssreset">' +
			'<div class="yui3-skin-code-note code-note">' +
			'<h1>Code Note</h1>' +
			'<div class="clear-search" id="clearBtn">x</div><input id="searchTitle" type="text" placeholder="Поиск по названию">' +
			'<input id="nbtitle" type="text" placeholder="Название">' +
			'<select id="nbname"></select>' +
			'<input id="nbtags" type="text" placeholder="Теги">' +
			'<div id="selectedTags"></div>' +
			'<button id="saveBtn">Сохранить</button>' +
			'<button id="cancelBtn">Отмена</button>' +
			'</div>' +
			'</div>',
		TAG_TEMPLATE = '<button class="tag">{tag}</button>',
		MESSSAGE_TEMPLATE = '<div class="yui3-skin-code-note code-note">{message}</div>';

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
			var body = Y.one('body'),
				panel = Y.Node.create(TEMPLATE);

			this._panel		  = panel;
			this._select	  = panel.one('#nbname');
			this._btnSave 	  = panel.one('#saveBtn');
			this._inputTitle  = panel.one('#nbtitle');
			this._inputSearch = panel.one('#searchTitle');
			this._blockTags   = panel.one('#selectedTags');
			this._inputTags	  = panel.one('#nbtags');
			this._btnClear    = panel.one('#clearBtn');

			panel.hide();
			body.appendChild(panel);
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
			var body = Y.one('body'),
				panel = Y.Node.create(Y.Lang.sub(MESSSAGE_TEMPLATE, { message: 'Success!' }));
			body.appendChild(panel);
			
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