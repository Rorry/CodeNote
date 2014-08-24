/**
 * The module provides a starting point to work with the plugin.
 *
 * @module cn-page-listener
 */
YUI.add('cn-page-listener', function (Y) {

  /**
   * The property is state of the Listener class.
   *
   * @property CURRENT_MODE_ON
   * @type {Bool}
   * @public
   */
  var CURRENT_MODE_ON = false;

  /**
   * The object with original cached nodes of code.
   *
   * @property Node
   * @namespace CN.Cache
   * @static
   */
  Y.namespace('CN.Cache').Node = {};

  /**
   * The class listens messages from background.js.
   * The Listener class collects all blocks of code on web page and shows a popup to work with this blocks of code.
   *
   * @class Listener
   * @namespace CN.Page
   * @static
   */
  Y.namespace('CN.Page').Listener = (function () {
    var _METHODS = [
        'init',
        'onAuthorise'
      ],
      _processor = new Y.CN.CodeProcessor(),
      _codeBlocks = new Y.NodeList(),
      _popup = new Y.CN.Popup({
        callback: function () {
          Y.CN.Page.Listener.init(); // emulation the message from background.js
        }
      }),

      /**
       * Collects all blocks of code on web page and caches their.
       *
       * @method _selectBlocks
       * @private
       */
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

      /**
       * Executes highlighting collected code blocks and shows\hides popup in according to state CURRENT_MODE_ON
       *
       * @method _init
       * @private
       */
      _init = function () {

        if (CURRENT_MODE_ON) { // turn off
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
        } else { // turn on
          if (_codeBlocks.isEmpty()) { // first time
            _selectBlocks();
          }

          _codeBlocks.each(function (node) {
            node.addClass('cn-marked');

            node.on('click', function () {
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

      /**
       * Executes popup initialization after authorization message
       *
       * @method _onAuthorise
       * @private
       */
      _onAuthorise = function (credentials) {
        if (CURRENT_MODE_ON) { // a message of authorization after the message of initialization
//          Y.log('<- success authorise: ' + credentials);
          _popup.initUI(credentials, _codeBlocks);
        }
      };
    
    return {
      METHODS: _METHODS,
      init: _init,
      onAuthorise: _onAuthorise
    };
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
//          port.postMessage({method: obj.method + ' back!'});
        }
      });
  });

});