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
			_selectedBlocks = new Y.NodeList(),
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
						node.removeAttribute('selected');
						node.removeClass('cn-selected');
						node.removeClass('cn-marked');
						node.setHTML(Y.CN.Cache.Node[node._yuid]);
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

			_onAuthorise = function (credentials) {
				if (CURRENT_MODE_ON) { // сообщение авторизации после сообщения инитиализации
					Y.log('<- success authorise: ' + credentials);

					_popup.initUI(credentials, _codeBlocks, function () {
						Y.CN.Page.Listener.init();
					});
				}
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

YUI({ lang: "en" }).use('cn-page-listener', function (Y) {

	chrome.extension.onConnect.addListener(function(port) {
    	port.onMessage.addListener(function (obj) {
    		if (obj.method && Y.Lang.isString(obj.method) && (Y.CN.Page.Listener.METHODS.indexOf(obj.method) > -1)) {
    			Y.CN.Page.Listener[obj.method](obj.data);
    			port.postMessage({method: obj.method + ' back!'});
    		}
    	});
	});

});