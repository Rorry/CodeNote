YUI.add('cn-page-listener', function (Y) {

	var CURRENT_MODE_ON = false;

	Y.namespace('CN.Cache').Node = {};

	Y.namespace('CN.Page').Listener = (function () {
		var _METHODS = [
				'init',
				'onAuthorise'
			],
			_processor = new Y.CN.CodeProcessor(),
			_codeBlocks = new Y.NodeList(),
			_popup = new Y.CN.Popup(),

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

			_init = function () {

				if (CURRENT_MODE_ON) { // выключаемся
					var nodes = Y.all('.cn-marked');

					nodes.each(function (node) {
						node.removeClass('cn-marked');
						node.detach();
					});

					_popup.reset();
					_popup.hide();
				} else { // включаемся
					if (_codeBlocks.isEmpty()) { // первый раз
						_selectBlocks();
					}

					_codeBlocks.each(function (node) {
						node.addClass('cn-marked');

						node.on('click', function (event) {
							var pre = this.one('pre');

							if (this.getAttribute('selected')) {
								this.removeClass('cn-selected');
								this.removeAttribute('selected');
								this.setHTML(Y.CN.Cache.Node[this._yuid]);
							} else {
								this.addClass('cn-selected');
								this.setAttribute('selected');
								_processor.processNode(pre);	
							}
						}, node);

						/*node.on('mouseenter', function (event) {
							var pre = this.one('pre');

							_processor.processNode(pre);
						}, node);

						node.on('mouseleave', function (event) {
							this.setHTML(Y.CN.Cache.Node[this._yuid]);
						}, node);*/
					});

					_popup.show();
				}
				CURRENT_MODE_ON = !CURRENT_MODE_ON;
			},

			_onAuthorise = function (credentials) {
				Y.log('<- success authorise: ' + credentials);

				_popup.initUI(credentials, _codeBlocks, function () {
					Y.CN.Page.Listener.init();
				});
			};
		
		return {
			METHODS: _METHODS,
			init: _init,
			onAuthorise: _onAuthorise
		}
	})();

}, '1.0', {
	requires: [
		'node',
		'cn-code-processor',
		'cn-code-note-popup'
	]
});

YUI().use('cn-page-listener', 'overlay', function (Y) {

	// var path = chrome.extension.getURL('lib/shCore.css');
	// Y.one('head').append('<link rel="stylesheet" type="text/css" href="' + path +'"/>');

	chrome.extension.onConnect.addListener(function(port) {
    	port.onMessage.addListener(function (obj) {
    		if (obj.method && Y.Lang.isString(obj.method) && (Y.CN.Page.Listener.METHODS.indexOf(obj.method) > -1)) {
    			Y.CN.Page.Listener[obj.method](obj.data);
    			port.postMessage({method: obj.method + ' back!'});
    		}
    	});
	});

});


/*btnSave.on('click', function (event) { // Сохраняем код.
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

						// node.setStyles(styles);
						node.removeAttribute('class');
						if (children) {
							children.each(function (subNode) {
								_packStyle(subNode);
							});
						}
					};

				_codeBlocks.each(function (node) {
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
				// Y.log(pack);

				// evernoteStorage.save(pack, function (note) {
				// 	Y.log(note);
				// });

				Y.CN.Page.Listener.init();
			});*/