YUI.add('cn-code-note-popup', function (Y) {

	var TEMPLATE = '<div class="yui3-skin-sam code-note">' +
			'<h1>Code Note</h1>' +
			'<div>' +
			'<select id="nbname"></select></div>' +
			'<div>' +
			'<input id="nbtitle" type="text" placeholder="Название"></div>' +
			'<input id="nbtags" type="text" placeholder="Теги">' +
			'<button id="save">Сохранить</button>' +
			'</div>';

	Y.namespace('CN').Popup = Y.Base.create('cn-code-note-popup', Y.Base, [], {

		_panel: null,
		_select: null,
		_btnSave: null,
		_inputTitle: null,
		_inputTags: null,

		initializer: function (config) {
			var body = Y.one('body'),
				panel = Y.Node.create(TEMPLATE);

			this._panel		 = panel;
			this._select	 = panel.one('#nbname');
			this._btnSave 	 = panel.one('#save');
			this._inputTitle = panel.one('#nbtitle');
			this._inputTags	 = panel.one('#nbtags');

			panel.hide();
			body.appendChild(panel);
		},

		initUI: function (credentials, codeBlocks, callback) {
			var self = this,
				evernoteStorage = new Y.CN.Evernote.Storage({ noteStoreURL: credentials.note_store_url, authenticationToken: credentials.oauth_token }),
				tags = [];

			evernoteStorage.listNotebooks(function (list) {
				self._select.empty();	
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

			self._inputTitle.on('change', function (event) {
				var title = event.target.get('value');

				evernoteStorage.setTitle(title);
			});

			self._inputTags.plug(Y.Plugin.AutoComplete, {
				resultHighlighter: 'phraseMatch',
				resultFilters: 'phraseMatch',
				resultTextLocator: 'name',
				source: tags,
				on: {
					select: function (event) {
						evernoteStorage.addTag(event.result.raw.guid);
					}
				}
			});

			self._btnSave.on('click', function (event) { // Сохраняем код.
				var note = Y.Node.create('<en-note></en-note>'),
					_packStyle = function (node) {
						var styles = {},
							children = node.get('children'),
							computedStyles = window.getComputedStyle(node._node, null),
							i,
							property;

						// for (i = 0; i < computedStyles.length; i++) {
						// 	property = computedStyles[i];

						// 	styles[property] = node.getStyle(property);
						// }

						node.setStyles(styles);
						node.removeAttribute('class');
						if (children) {
							children.each(function (subNode) {
								_packStyle(subNode);
							});
						}
					};

				codeBlocks.each(function (node) {
					node.removeClass('cn-marked');
					node.setHTML(Y.CN.Cache.Node[node._yuid]);
					// var pre = this.one('pre');
					// processor.processNode(pre);
					node.detach();
					_packStyle(node);
					note.appendChild(node.cloneNode(true));
				});	

				var pack = Y.Lang.sub('<?xml version="1.0" encoding="UTF-8"?>' +
								'<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">' +
								'<en-note>{note}</en-note>', {
									note: note.getHTML()
								});

				pack = pack.replace(/id="[\s|\w]*"/g, '');
				pack = pack.replace(/<\/code>/g, '</span>');
				pack = pack.replace(/<code/g, '<span');
				pack = pack.replace(/<td [\w|=|\"|\s]*">/g, '<td>');
				pack = pack.replace(/<table [\w|=|\"|\s]*>/g, '<table>');
				pack = pack.replace(/<br>/g, '<br></br>');
				// Y.log(pack);

				evernoteStorage.save(pack, function (note) {
					Y.log(note);
				});
				
				if (Y.Lang.isFunction (callback)) {
					callback();
				}
			});
		},

		show: function () {
			this._panel.show();
		},

		hide: function () {
			this._panel.hide();
		}

	}, {
		ATTRS: {
			
		}
	});

}, '1.0', {
	requires: [
		'node',
		'autocomplete',
		'autocomplete-highlighters',
		'autocomplete-filters',
		'evernote-storage'
	]
});