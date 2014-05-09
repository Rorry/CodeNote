YUI.add('cn-css-inliner', function (Y) {

	var _ideaCSS = [
		{
			key: '.hljs',
			value: 'display: block; padding: 0.5em;' +
  					'color: #000;' +
  					'background: #fff;'
		},
		{
			key: '.hljs-subst,' +
				'.hljs-title',
			value: 'font-weight: normal;' +
  					'color: #000;'
		},
		{
			key: '.hljs-comment,' +
					'.hljs-template_comment,' +
					'.hljs-javadoc,' +
					'.diff .hljs-header',
			value: 'color: #808080;' +
  					'font-style: italic;'
		},
		{
			key: '.hljs-annotation,' +
					'.hljs-decorator,' +
					'.hljs-preprocessor,' +
					'.hljs-pragma,' +
					'.hljs-doctype,' +
					'.hljs-pi,' +
					'.hljs-chunk,' +
					'.hljs-shebang,' +
					'.apache .hljs-cbracket,' +
					'.hljs-prompt,' +
					'.http .hljs-title',
			value: 'color: #808000;'
		},
		{
			key: '.hljs-tag,' +
					'.hljs-pi',
			value: 'background: #efefef;'
		},
		{
			key: '.hljs-tag .hljs-title,' +
					'.hljs-id,' +
					'.hljs-attr_selector,' +
					'.hljs-pseudo,' +
					'.hljs-literal,' +
					'.hljs-keyword,' +
					'.hljs-hexcolor,' +
					'.css .hljs-function,' +
					'.ini .hljs-title,' +
					'.css .hljs-class,' +
					'.hljs-list .hljs-title,' +
					'.clojure .hljs-title,' +
					'.nginx .hljs-title,' +
					'.tex .hljs-command,' +
					'.hljs-request,' +
					'.hljs-status',
			value: 'font-weight: bold;' +
  					'color: #000080;'
		},
		{
			key: '.hljs-attribute,' +
					'.hljs-rules .hljs-keyword,' +
					'.hljs-number,' +
					'.hljs-date,' +
					'.hljs-regexp,' +
					'.tex .hljs-special',
			value: 'font-weight: bold;' +
  					'color: #0000ff;'
		},
		{
			key: '.hljs-number,' +
					'.hljs-regexp',
			value: 'font-weight: normal;'
		},
		{
			key: '.hljs-string,' +
					'.hljs-value,' +
					'.hljs-filter .hljs-argument,' +
					'.css .hljs-function .hljs-params,' +
					'.apache .hljs-tag',
			value: 'color: #008000;' +
  					'font-weight: bold;'
		},
		{
			key: '.hljs-symbol,' +
					'.ruby .hljs-symbol .hljs-string,' +
					'.hljs-char,' +
					'.tex .hljs-formula',
			value: 'color: #000;' +
  					'background: #d0eded;' +
  					'font-style: italic;'
		},
		{
			key: '.hljs-phpdoc,' +
					'.hljs-yardoctag,' +
					'.hljs-javadoctag',
			value: 'text-decoration: underline;'
		},
		{
			key: '.hljs-variable,' +
					'.hljs-envvar,' +
					'.apache .hljs-sqbracket,' +
					'.nginx .hljs-built_in',
			value: 'color: #660e7a;'
		},
		{
			key: '.hljs-addition',
			value: 'background: #baeeba;'
		},
		{
			key: '.hljs-deletion',
			value: 'background: #ffc8bd;'
		},
		{
			key: '.diff .hljs-change',
			value: 'background: #bccff9;'
		}
	];

	
	Y.namespace('CN').CSSInliner = (function () {
		var _toInline = function (node) {
				var i, rule, style;
				
				for (i = 0; i < _ideaCSS.length; i++) {
					rule = _ideaCSS[i];
					node.all(rule.key).each(function (elem) {
						style = elem.getAttribute('cn-style_') + rule.value;
						elem.setAttribute('cn-style_', style);
						elem.removeAttribute('class');
					});
				}
			};

		return {
			toInline: _toInline
		};
	}) ();

}, '1.0', {
	requires: [
	]
});


// unused
var _shCoreDefaultCSS = [
		{
			key: '.syntaxhighlighter a,' +
				'.syntaxhighlighter div,' +
				'.syntaxhighlighter code,' +
				'.syntaxhighlighter table,' +
				'.syntaxhighlighter table td,' +
				'.syntaxhighlighter table tr,' +
				'.syntaxhighlighter table tbody,' +
				'.syntaxhighlighter table thead,' +
				'.syntaxhighlighter table caption,' +
				'.syntaxhighlighter textarea',
			value: '-moz-border-radius: 0 0 0 0 !important;' +
					'-webkit-border-radius: 0 0 0 0 !important;' +
  					'background: none !important;' +
  					'border: 0 !important;' +
  					'bottom: auto !important;' +
  					'float: none !important;' +
  					'height: auto !important;' +
  					'left: auto !important;' +
  					'line-height: 1.1em !important;' +
  					'margin: 0 !important;' +
  					'outline: 0 !important;' +
  					'overflow: visible !important;' +
  					'padding: 0 !important;' +
  					'position: static !important;' +
  					'right: auto !important;' +
  					'text-align: left !important;' +
  					'top: auto !important;' +
  					'vertical-align: baseline !important;' +
  					'width: auto !important;' +
  					'box-sizing: content-box !important;' +
  					'font-family: "Consolas", "Bitstream Vera Sans Mono", "Courier New", Courier, monospace !important;' +
  					'font-weight: normal !important;' +
  					'font-style: normal !important;' +
  					'font-size: 1em !important;' +
  					'min-height: inherit !important;' +
  					'min-height: auto !important;'
		},
		{
			key: '.syntaxhighlighter',
			value: 'width: 100% !important;' +
  					'margin: 1em 0 1em 0 !important;' +
  					'position: relative !important;' +
  					'overflow: auto !important;' +
  					'font-size: 1em !important;'
		},
		{
			key: '.syntaxhighlighter.source',
			value: 'overflow: hidden !important;'
		},
		{
			key: '.syntaxhighlighter .bold',
			value: 'font-weight: bold !important;'
		},
		{
			key: '.syntaxhighlighter .italic',
			value: 'font-style: italic !important;'
		},
		{
			key: '.syntaxhighlighter .line',
			value: 'white-space: pre !important;'
		},
		{
			key: '.syntaxhighlighter table',
			value: 'width: 100% !important;'
		},
		{
			key: '.syntaxhighlighter table caption',
			value: 'text-align: left !important;' +
      				'padding: .5em 0 0.5em 1em !important;'
		},
		{
			key: '.syntaxhighlighter table td.code',
			value: 'width: 100% !important;'
		}, 
		{
			key: '.syntaxhighlighter table td.code .container',
			value: 'position: relative !important;'
		},
		{
			key: '.syntaxhighlighter table td.code .container textarea',
			value: 'box-sizing: border-box !important;' +
          			'position: absolute !important;' +
          			'left: 0 !important;' +
          			'top: 0 !important;' +
          			'width: 100% !important;' +
          			'height: 100% !important;' +
          			'border: none !important;' +
          			'background: white !important;' +
          			'padding-left: 1em !important;' +
          			'overflow: hidden !important;' +
          			'white-space: pre !important;'
		}, 
		{
			key: '.syntaxhighlighter table td.gutter .line',
			value: 'text-align: right !important;' +
      				'padding: 0 0.5em 0 1em !important;'
		},
		{
			key: '.syntaxhighlighter table td.code .line',
			value: 'padding: 0 1em !important;'
		},
		{
			key: '.syntaxhighlighter.nogutter td.code .container textarea, .syntaxhighlighter.nogutter td.code .line',
			value: 'padding-left: 0em !important;'
		}, 
		{
			key: '.syntaxhighlighter.show',
			value: 'display: block !important;'
		}, 
		{
			key: '.syntaxhighlighter.collapsed table',
			value: 'display: none !important;'
		},
		{
			key: '.syntaxhighlighter.collapsed .toolbar',
			value: 'padding: 0.1em 0.8em 0em 0.8em !important;' +
    				'font-size: 1em !important;' +
    				'position: static !important;' +
    				'width: auto !important;' +
    				'height: auto !important;'
		},
		{
			key: '.syntaxhighlighter.collapsed .toolbar span',
			value: 'display: inline !important;' +
      				'margin-right: 1em !important;'
		},
		{
			key: '.syntaxhighlighter.collapsed .toolbar span a',
			value: 'padding: 0 !important;' +
        			'display: none !important;'
		},
		{
			key: '.syntaxhighlighter.collapsed .toolbar span a.expandSource',
			value: 'display: inline !important;'
		},
		{
			key: '.syntaxhighlighter .toolbar',
			value: 'position: absolute !important;' +
    				'right: 1px !important;' +
    				'top: 1px !important;' +
    				'width: 11px !important;' +
    				'height: 11px !important;' +
    				'font-size: 10px !important;' +
    				'z-index: 10 !important;'
		},
		{
			key: '.syntaxhighlighter .toolbar span.title',
			value: 'display: inline !important;'
		},
		{
			key: '.syntaxhighlighter .toolbar a',
			value: 'display: block !important;' +
      				'text-align: center !important;' +
      				'text-decoration: none !important;' +
      				'padding-top: 1px !important;'
		},
		{
			key: '.syntaxhighlighter .toolbar a.expandSource',
			value: 'display: none !important;'
		},
		{
			key: '.syntaxhighlighter.printing .line.alt1 .content,' +
  					'.syntaxhighlighter.printing .line.alt2 .content,' +
  					'.syntaxhighlighter.printing .line.highlighted .number,' +
  					'.syntaxhighlighter.printing .line.highlighted.alt1 .content,' +
  					'.syntaxhighlighter.printing .line.highlighted.alt2 .content',
  			value: 'background: none !important;'
		},
		{
			key: '.syntaxhighlighter.printing .line .number',
			value: 'color: #bbbbbb !important;'
		},
		{
			key: '.syntaxhighlighter.printing .line .content',
			value: 'color: black !important;'
		},
		{
			key: '.syntaxhighlighter.printing .toolbar',
			value: 'display: none !important;'
		},
		{
			key: '.syntaxhighlighter.printing a',
			value: 'text-decoration: none !important;'
		},
		{
			key: '.syntaxhighlighter.printing .plain, .syntaxhighlighter.printing .plain a',
			value: 'color: black !important;'
		},
		{
			key: '.syntaxhighlighter.printing .comments, .syntaxhighlighter.printing .comments a',
			value: 'color: #008200 !important;'
		},
		{
			key: '.syntaxhighlighter.printing .string, .syntaxhighlighter.printing .string a',
			value: 'color: blue !important;'
		},
		{
			key: '.syntaxhighlighter.printing .keyword',
			value: 'color: #006699 !important;' +
    				'font-weight: bold !important;'
		},
		{
			key: '.syntaxhighlighter.printing .preprocessor',
			value: 'color: gray !important;'
		},
		{
			key: '.syntaxhighlighter.printing .variable',
			value: 'color: #aa7700 !important;'
		},
		{
			key: '.syntaxhighlighter.printing .value',
			value: 'color: #009900 !important;'
		},
		{
			key: '.syntaxhighlighter.printing .functions',
			value: 'color: #ff1493 !important;'
		},
		{
			key: '.syntaxhighlighter.printing .constants',
			value: 'color: #0066cc !important;'
		},
		{
			key: '.syntaxhighlighter.printing .script',
			value: 'font-weight: bold !important;'
		},
		{
			key: '.syntaxhighlighter.printing .color1, .syntaxhighlighter.printing .color1 a',
			value: 'color: gray !important;'
		},
		{
			key: '.syntaxhighlighter.printing .color2, .syntaxhighlighter.printing .color2 a',
			value: 'color: #ff1493 !important;'
		},
		{
			key: '.syntaxhighlighter.printing .color3, .syntaxhighlighter.printing .color3 a',
			value: 'color: red !important;'
		},
		{
			key: '.syntaxhighlighter.printing .break, .syntaxhighlighter.printing .break a',
			value: 'color: black !important;'
		},
		{
			key: '.syntaxhighlighter',
			value: 'background-color: white !important;'
		},
		{
			key: '.syntaxhighlighter .line.alt1',
			value: 'background-color: white !important;'
		},
		{
			key: '.syntaxhighlighter .line.alt2',
			value: 'background-color: white !important;'
		},
		{
			key: '.syntaxhighlighter .line.highlighted.alt1, .syntaxhighlighter .line.highlighted.alt2',
			value: 'background-color: #e0e0e0 !important;'
		},
		{
			key: '.syntaxhighlighter .line.highlighted.number',
			value: 'color: black !important;'
		},
		{
			key: '.syntaxhighlighter table caption',
			value: 'color: black !important;'
		},
		{
			key: '.syntaxhighlighter table td.code .container textarea',
			value: 'background: white;' +
    				'color: black;'
		},
		{
			key: '.syntaxhighlighter .gutter',
			value: 'color: #afafaf !important;'
		},
		{
			key: '.syntaxhighlighter .gutter .line',
			value: 'border-right: 3px solid #6ce26c !important;'
		},
		{
			key: '.syntaxhighlighter .gutter .line.highlighted',
			value: 'background-color: #6ce26c !important;' +
        			'color: white !important;'
		},
		{
			key: '.syntaxhighlighter.printing .line .content',
			value: 'border: none !important;'
		},
		{
			key: '.syntaxhighlighter.collapsed',
			value: 'overflow: visible !important;'
		},
		{
			key: '.syntaxhighlighter.collapsed .toolbar',
			value: 'color: blue !important;' +
      				'background: white !important;' +
      				'border: 1px solid #6ce26c !important;'
		},
		{
			key: '.syntaxhighlighter.collapsed .toolbar a',
			value: 'color: blue !important;'
		},
		{
			key: '.syntaxhighlighter.collapsed .toolbar a:hover',
			value: 'color: red !important;'
		},
		{
			key: '.syntaxhighlighter .toolbar',
			value: 'color: white !important;' +
    				'background: #6ce26c !important;' +
    				'border: none !important;'
		},
		{
			key: '.syntaxhighlighter .toolbar a',
			value: 'color: white !important;'
		},
		{
			key: '.syntaxhighlighter .toolbar a:hover',
			value: 'color: black !important;'
		},
		{
			key: '.syntaxhighlighter .plain, .syntaxhighlighter .plain a',
			value: 'color: black !important;'
		},
		{
			key: '.syntaxhighlighter .comments, .syntaxhighlighter .comments a',
			value: 'color: #008200 !important;'
		},
		{
			key: '.syntaxhighlighter .string, .syntaxhighlighter .string a',
			value: 'color: blue !important;'
		},
		{
			key: '.syntaxhighlighter .keyword',
			value: 'color: #006699 !important;'
		},
		{
			key: '.syntaxhighlighter .preprocessor',
			value: 'color: gray !important;'
		},
		{
			key: '.syntaxhighlighter .variable',
			value: 'color: #aa7700 !important;'
		},
		{
			key: '.syntaxhighlighter .value',
			value: 'color: #009900 !important;'
		},
		{
			key: '.syntaxhighlighter .functions',
			value: 'color: deeppink !important;'
		},
		{
			key: '.syntaxhighlighter .constants',
			value: 'color: #0066cc !important;'
		},
		{
			key: '.syntaxhighlighter .script',
			value: 'font-weight: bold !important;' +
    				'color: #006699 !important;' +
    				'background-color: none !important;'
		},
		{
			key: '.syntaxhighlighter .color1, .syntaxhighlighter .color1 a',
			value: 'color: gray !important;'
		},
		{
			key: '.syntaxhighlighter .color2, .syntaxhighlighter .color2 a',
			value: 'color: deeppink !important;'
		},
		{
			key: '.syntaxhighlighter .color3, .syntaxhighlighter .color3 a',
			value: 'color: red !important;'
		},
		{
			key: '.syntaxhighlighter .keyword',
			value: 'font-weight: bold !important;'
		}
	];