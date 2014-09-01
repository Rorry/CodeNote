/*
YUI.add('e2-stream', function (Y) {

    Y.namespace('E2').StringStream = Y.Base.create('e2-string-stream', Y.Base, [], {
        skipBlank: function () {
            var ch = this.peek();
            while (/\s/.test(ch)) {
                ch = this.read();
                ch = this.peek();
            }
        },

        readLine: function () {
            var line = '',
                ch = this.peek();

            if (!this.eot()) {

                while (ch && ch !== '\n') {
                    ch = this.read();
                    line += ch;
                    ch = this.peek();
                }

                return line;
            }
            return null;
        },

        readWord: function () {
            var word = '',
                ch = this.peek();

            while (/[a-zA-Z_]/.test(ch)) {
                ch = this.read();
                word += ch;
                ch = this.peek();
            }
            return word;
        },

        read: function () {
            var pos = this.getPos(),
                ch = this.peek();

            if (ch) {
                pos += 1;
                this.setPos(pos);
            }
            return ch;
        },

        peek: function () {
            var pos = this.getPos(),
                buf = this.getBuf();
            
            if (buf && buf.length > pos) {
                return buf.charAt(pos);
            }
            return null;
        },

        back: function (n) {
            var pos = this.getPos();

            pos -= n;
            this.setPos(pos < 0 ? 0 : pos);
        },

        newLine: function () {
            var pos = this.getPos();

            return (pos === 0) || this.peek() === '\n';
        },

        eot: function () {
            var buf = this.getBuf(),
                pos = this.getPos();

            return !(buf && buf.length > pos);
        },

        getBuf: function () {
            return this.get('buf');
        },

        setBuf: function (buf) {
            return this.set('buf', buf);
        },

        getPos: function () {
            return this.get('pos');
        },

        setPos: function (pos) {
            return this.set('pos', pos);
        }
    }, {
        ATTRS: {
            buf: {
                value: null,
                validator: Y.Lang.isString
            },
            pos: {
                value: 0,
                validator: Y.Lang.isNumber
            }
        }
    });

}, '1.0', {
    requires: [
        'base'
    ]
});

YUI.add('e2-prog-lang', function (Y) {

    var TYPE = {
            ATOM        : 'atom',
            ATTRIBUTE   : 'attribute',
            COMMENT     : 'comment',
            DEFAULT     : 'default',
            DEFINITION  : 'definition',
            DELIMITER   : 'delimiter',
            ERROR       : 'error',
            KEYWORD     : 'keyword',
            LINK        : 'link',
            NUMBER      : 'number',
            PROPERTY    : 'property',
            STRING      : 'string',
            VARIABLE    : 'variable',
            TAG         : 'tag'
        };

    Y.namespace('E2').ProgLanguage = Y.Base.create('e2-prog-lang', Y.Model, [], {
        startState: function () {
        },

        getToken: function (stream, state) {
        },

        getName: function () {
            return this.get('name');
        },

        getAliases: function () {
            return this.get('aliases');
        }
    }, {
        TYPE: TYPE,

        ATTRS: {
            name: {
                value: null,
                validator: Y.Lang.isString,
                readOnly: true
            },
            aliases: {
                value: [],
                validator: Y.Lang.isArray,
                readOnly: true
            }
        }
    });


    Y.namespace('E2').ProgLanguages = Y.Base.create('e2-prog-langs', Y.ModelList, [], {
        model: Y.E2.ProgLanguage,

        find: function (name) {
            var result = null;

            this.each(function (lang) {
                if (lang.getName() == name || lang.getAliases().indexOf(name) >= 0) {
                    result = lang;
                }
            });

            return result;
        }
    });

    Y.namespace('E2.ProgLang').Plain = Y.Base.create('e2-prog-lang-plain', Y.E2.ProgLanguage, [], {
        getToken: function (stream) {
            var line = stream.readLine();

            if (line) {
                return {
                    type: Y.E2.ProgLanguage.TYPE.DEFAULT,
                    text: line
                };
            }
            return null;
        }
    }, {
        ATTRS: {
            name: {
                value: 'plain'
            },

            aliases: {
                value: ['plain']
            }            
        }
    });

    Y.namespace('E2.ProgLang').Diff = Y.Base.create('e2-prog-lang-diff', Y.E2.ProgLanguage, [], {
        getToken: function (stream) {
            var result = {},
                first,
                line = stream.readLine();

            if (line) {
                result.text = line;
                first = line.charAt(0);
                if (first === '@') {
                    result.type = Y.E2.ProgLanguage.TYPE.KEYWORD;
                } else if (first === '+') {
                    result.type = Y.E2.ProgLanguage.TYPE.VARIABLE;
                } else if (first === '-') {
                    result.type = Y.E2.ProgLanguage.TYPE.DEFINITION;
                } else {
                    result.type = Y.E2.ProgLanguage.TYPE.DEFAULT;
                }
                return result;
            }
            return null;
        }
    }, {
        ATTRS: {
            name: {
                value: 'diff'
            },

            aliases: {
                value: ['diff', 'patch']
            }
        }
    });

    Y.namespace('E2.ProgLang').All = new Y.E2.ProgLanguages();

    Y.E2.ProgLang.All.add(new Y.E2.ProgLang.Plain());
    Y.E2.ProgLang.All.add(new Y.E2.ProgLang.Diff());

}, '1.0', {
    requires: [
        'model',
        'model-list',
        'e2-stream'
    ]
});

YUI.add('e2-highlight', function (Y) {

    var STYLES = {
            'default'    : 'background: #272822; color: #f8f8f2;',
            'keyword'    : 'color: #f92672;',
            'atom'       : 'color: #ae81ff;',
            'number'     : 'color: #ae81ff;',
            'string'     : 'color: #e6db74;',
            'property'   : 'color: #a6e22e;',
            'attribute'  : 'color: #a6e22e;',
            'variable'   : 'color: #a6e22e;',
            'definition' : 'color: #fd971f;',
            'delimiter'  : 'color: #f8f8f2;',
            'tag'        : 'color: #f92672;',
            'link'       : 'color: #ae81ff;',
            'error'      : 'background: #f92672; color: #f8f8f0;',
            'comment'    : 'color: #75715e;'
        };

    Y.namespace('E2').Highlight = Y.Base.create('e2-highlight', Y.Base, [], {
        applyStyles: function (name, node) {
            var styles = this.getStyles(),
                style = styles[name] || styles.default;

            node.set('style', style);
        },

        process: function (node) {
            var ch,
                state,
                token,
                tokenNode,
                lineNode = null,
                holdNode = Y.Node.create(this.getHoldNode()),
                stream = new Y.E2.StringStream({ buf: node.getHTML() }),
                lang = this.findLang(node.get('lang') || 'plain');

            this.applyStyles('default', holdNode);

            state = lang.startState();

            while (!stream.eot()) {
                if (stream.newLine() || Y.Lang.isNull(lineNode)) {
                    if (lineNode && lineNode.get('parent') !== holdNode) {
                        holdNode.appendChild(lineNode);
                    }
                    lineNode = Y.Node.create(this.getLineNode());
                    ch = stream.read();
                }

                token = lang.getToken(stream, state);

                if (token) {
                    tokenNode = Y.Node.create(this.getTokenNode());
                    tokenNode.set('text', token.text);
                    this.applyStyles(token.type, tokenNode);
                    lineNode.appendChild(tokenNode);
                }
            }

            if (lineNode && lineNode.get('text').length > 0) {
                holdNode.appendChild(lineNode);
            }

            return holdNode;
        },

        findLang: function (tag) {
            var langs = this.getLanguages(),
                lang = langs.find(tag);

            return lang || langs.find('plain');
        },

        getHoldNode: function () {
            return this.get('holdNode');
        },

        getLineNode: function () {
            return this.get('lineNode');
        },

        getTokenNode: function () {
            return this.get('tokenNode');
        },

        getStyles: function () {
            return this.get('styles');
        },

        getLanguages: function () {
            return this.get('languages');
        },
    }, {
        ATTRS: {
            holdNode: {
                value: '<ol></ol>',
                validator: Y.Lang.isString,
                readOnly: true
            },
            lineNode: {
                value: '<li></li>',
                validator: Y.Lang.isString,
                readOnly: true
            },
            tokenNode: {
                value: '<span></span>',
                validator: Y.Lang.isString,
                readOnly: true
            },
            styles: {
                value: STYLES,
                validator: Y.Lang.isObject,
                readOnly: true
            },
            languages: {
                value: Y.E2.ProgLang.All,
                validator: function (val) {
                    return val instanceof Y.E2.ProgLanguages;
                }
            }
        }
    });

}, '1.0', {
    requires: [
        'node',
        'e2-stream',
        'e2-prog-lang'
    ]
});

YUI().use('e2-stream', 'e2-prog-lang', 'e2-highlight', 'test', function (Y) {

    var highlight = new Y.E2.Highlight(),
        res = Y.one('#res'),
        nodes = Y.all('pre');

    nodes.each(function (node) {
        res.appendChild(highlight.process(node));
    });

    Y.log('testing');

    var TEST_STRING = 'This is test string.\nHello world!',
        testCaseStream = new Y.Test.Case({
            name: 'test e2-stream',
            testCreate: function () {
                var stream = new Y.E2.StringStream({ buf: TEST_STRING });

                Y.Assert.areEqual(TEST_STRING, stream.getBuf(), 'Buffer not setted.');
            },
            testRead: function () {
                var stream = new Y.E2.StringStream({ buf: TEST_STRING }),
                    ch = stream.read();

                Y.Assert.areEqual(TEST_STRING.charAt(0), ch, 'First char must be "T"');
            },
            testReadWord: function () {
                var stream = new Y.E2.StringStream({ buf: TEST_STRING }),
                    word = stream.readWord();

                Y.Assert.areEqual('This', word, 'The first word is "This"');
            },
            testReadLine: function () {
                var stream = new Y.E2.StringStream({ buf: TEST_STRING }),
                    line = stream.readLine();

                Y.Assert.areEqual((TEST_STRING.split('\n'))[0], line, 'Expected first line of ' + TEST_STRING);
            }
        }),
        testCaseProgLang = new Y.Test.Case({
            name: 'test e2-prog-lang',
            testCreate: function () {
                var lang = new Y.E2.ProgLang.Plain();

                Y.Assert.areEqual('plain', lang.getName(), 'Expected "plain"');
            },
            testFind: function () {
                var lang = Y.E2.ProgLang.All.find('plain');

                Y.Assert.isNotNull(lang, 'Must be find object');
            }
        }),
        testCaseHighlihgt = new Y.Test.Case({
            name: 'test e2-highlight',
            testCreate: function () {
                var highlight = new Y.E2.Highlight();

                Y.Assert.isNotNull(highlight.getStyles(), 'Must be default styles');
            }
        });

    Y.Test.Runner.add(testCaseStream);
    Y.Test.Runner.add(testCaseProgLang);
    Y.Test.Runner.add(testCaseHighlihgt);
    Y.Test.Runner.run();

});
*/
