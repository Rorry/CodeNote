YUI.add('cn-page-listener', function (Y) {

	var CURRENT_MODE_ON = false;

	var TEMPLATE = '<div class="code-note">' +
			'<h1>Code Note</h1>' +
			'<div>' +
			'<select id="nbname"></select></div>' +
			'<div>' +
			'<input id="nbtitle" type="text" placeholder="Название"></div>' +
			'<button id="save">Сохранить</button>' +
			'</div>';

	var panel 		= Y.Node.create(TEMPLATE),
		select  	= panel.one('#nbname'),
		btnSave 	= panel.one('#save'),
		inputTitle 	= panel.one('#nbtitle'),
		body 		= Y.one('body');

	panel.hide();
	body.appendChild(panel);

	Y.namespace('CN.Cache').Node = {};

	var methods = [
			'init',
			'onAuthorise'
		],
		processor = new Y.CN.CodeProcessor(),
		codeBlocks = new Y.NodeList();
		

	Y.namespace('CN.Page').Listener = (function () {
		var _selectBlocks = function () {
				var preBlocks = Y.all('pre');

				preBlocks.each(function (block) {
					var clone = block.cloneNode(true),
						node  = Y.Node.create('<div></div>');

					block.replace(node);
					node.setHTML(clone._node);
					Y.CN.Cache.Node[node._yuid] = node.getHTML();
					codeBlocks.push(node);
				});
			},
			_init = function () {

				if (CURRENT_MODE_ON) { // выключаемся
					var nodes = Y.all('.cn-marked');

					nodes.each(function (node) {
						node.removeClass('cn-marked');
						node.detach();
					});

					panel.hide();
				} else { // включаемся
					if (codeBlocks.isEmpty()) { // первый раз
						_selectBlocks();
					}

					codeBlocks.each(function (node) {
						node.addClass('cn-marked');

						node.on('mouseenter', function (event) {
							var pre = this.one('pre');

							processor.processNode(pre);
						}, node);

						node.on('mouseleave', function (event) {
							this.setHTML(Y.CN.Cache.Node[this._yuid]);
						}, node);
					});

					panel.show();
				}
				CURRENT_MODE_ON = !CURRENT_MODE_ON;


			},
			_onAuthorise = function (credentials) {
				var evernoteStorage = new Y.CN.Evernote.Storage({ noteStoreURL: credentials.note_store_url, authenticationToken: credentials.oauth_token });

				Y.log('<- success authorise: ' + credentials);

				if (codeBlocks.isEmpty()) { // находим блоки, если еще не нашли
					_selectBlocks();
				}

				evernoteStorage.listNotebooks(function (list) {
					select.empty();	
					Y.Array.each(list, function (item) {
						var guid = item.guid,
							name = item.name,
							option = Y.Node.create(Y.Lang.sub('<option value="{guid}">{name}</option>', { guid: guid, name: name }));

						if (item.defaultNotebook) {
							evernoteStorage.setNoteBook(guid);
							option.set('selected', 'selected');
						}
							
						select.appendChild(option);
					});
				});


				select.on('change', function (event) {
					var guid = event.target.get('value');

					evernoteStorage.setNoteBook(guid);	
				});

				inputTitle.on('change', function (event) {
					var title = event.target.get('value');

					evernoteStorage.setTitle(title);
				});

				btnSave.on('click', function (event) { // Сохраняем код.
					var note = Y.Node.create('<en-note></en-note>'),
						_packStyle = function (node) {
							var styles = {					
									background 		: node.getStyle('background'),
									// border 			: node.getStyle('border'),
									// bottom 			: node.getStyle('bottom'),
									// height 			: node.getStyle('height'),
									// left 			: node.getStyle('left'),
									// lineHeight 		: node.getStyle('lineHeight'),
									// margin 			: node.getStyle('margin'),
									// outline 		: node.getStyle('outline'),
									// overflow 		: node.getStyle('overflow'),
									// padding 		: node.getStyle('padding'),
									// position 		: node.getStyle('position'),
									// right 			: node.getStyle('right'),
									// textAlign 		: node.getStyle('textAlign'),
									// top 			: node.getStyle('top'),
									// verticalAlign 	: node.getStyle('verticalAlign'),
									// width 			: node.getStyle('width'),
									// boxSizing 		: node.getStyle('boxSizing'),
									// fontFamily 		: node.getStyle('fontFamily'),
									fontWeigth 		: node.getStyle('fontWeigth'),
									fontStyle 		: node.getStyle('fontStyle'),
									fontSize 		: node.getStyle('fontSize'),
									color 			: node.getStyle('color')
									// minHeight 		: node.getStyle('minHeight'),
									// textDecoration 	: node.getStyle('textDecoration'),
									// display 		: node.getStyle('display'),
									// backgroundColor	: node.getStyle('backgroundColor'),
									// borderRight 	: node.getStyle('borderRight'),
									// lineHeight 		: node.getStyle('lineHeight')
								},
								children = node.get('children');

							node.removeAttribute('class');
							node.setStyles(styles);
							if (children) {
								children.each(function (subNode) {
									_packStyle(subNode);
								});
							}
						};

					codeBlocks.each(function (node) {
						node.removeClass('cn-marked');
						node.setHTML(Y.CN.Cache.Node[node._yuid]);
						var pre = this.one('pre');
						processor.processNode(pre);
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
					Y.log(pack);

					evernoteStorage.save(pack, function (note) {
						Y.log(note);
					});

					Y.CN.Page.Listener.init();
				});
			};
		
		return {
			init: _init,
			onAuthorise: _onAuthorise
		}
	})();

}, '1.0', {
	requires: [
		'node',
		'cn-code-processor',
		'evernote-storage'
	]
});

YUI().use('cn-page-listener', 'overlay', function (Y) {

	chrome.extension.onConnect.addListener(function(port){
    	port.onMessage.addListener(function (obj) {
    		if (obj.method) {
    			Y.CN.Page.Listener[obj.method](obj.data);
    			port.postMessage({method: obj.method + ' back!'});
    		}
    	});
	});

});