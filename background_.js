window.onload = function () {

	var authorise = function() {
		var client = new Client({
			consumerKey 	: '<your consumer key>',
			consumerSecret 	: '<your consumer secret>',
			serviceHost		: 'https://sandbox.evernote.com',
			callbackUrl		: 'callback.html'
		});

		client.getRequestToken();
	};

	var factory = function (obj) {
    	console.log(obj);
	};

	var CURRENT_MODE_ON = true;

	//set handler to extention on icon click
	chrome.browserAction.onClicked.addListener(function(tab) {
		var port = chrome.tabs.connect(tab.id);			

		port.postMessage({method: 'init'});
		port.onMessage.addListener(factory);

		if (CURRENT_MODE_ON) { //Отправлять сообщение авторизации только при открытии
			chrome.storage.local.get('evernote_credentials', function (items) {
				var evernote_credentials = items.evernote_credentials;

				if (evernote_credentials === undefined || evernote_credentials === null) {
					authorise();
				} else {
					port.postMessage({method: 'onAuthorise', data: evernote_credentials});
				}
			});
		}

		chrome.storage.onChanged.addListener(function (changes, areaName) {
			console.log('On change storage!');
			console.log(changes);
			if (areaName === 'local') {
				if (changes.evernote_credentials) {
					port.postMessage({method: 'onAuthorise', data: changes.evernote_credentials.newValue});	
				}
			}
		});

		CURRENT_MODE_ON = !CURRENT_MODE_ON;
	});	
};

var Client = function (options) {
	this.consumerKey = options.consumerKey;
	this.consumerSecret = options.consumerSecret;
	this.callbackUrl = options.callbackUrl;
	this.serviceHost = options.serviceHost;
	// this.signatureMethod = "HMAC-SHA1";
};

Client.prototype.PARAM_KEYS = {
	OAUTH_TOKEN: 'oauth_token',
	OAUTH_TOKEN_SECRET: 'oauth_token_secret',
	OAUTH_VERIFIER: 'oauth_verifier',
	EDAM_NOTESTOREURL: 'edam_noteStoreUrl',
	EDAM_USERID: 'edam_userId',
	EXPIRES: 'expires'
};

Client.prototype.tabListener = function (oauthTabId) {
	var self = this;

	return function tabUpdateListener(tabId, event) {
		var params,
			oauth_token,
			oauth_verifier;

		if (tabId === oauthTabId && event.url && event.status === "loading") {
			if (event.url.indexOf(self.callbackUrl) > -1) {
				console.log("tabListener!");
				console.log(event);

				params = self.getParamValues(event.url.split('?')[1], ['oauth_token', 'oauth_verifier']);
				oauth_token = params.oauth_token;
				oauth_verifier = params.oauth_verifier;

				self.getAuthToken(oauth_token, oauth_verifier);

				chrome.tabs.onUpdated.removeListener(tabUpdateListener);
				chrome.tabs.remove(tabId);
			}
		}
	};
};

Client.prototype.onRequestToken = function (data) {
	var self = this,
		tokens = self.getParamValues(data.text, ['oauth_token', 'oauth_token_secret'])
		oauth_token = tokens.oauth_token,
		token_secret = tokens.oauth_token_secret,
		authURL = self.serviceHost + '/OAuth.action?oauth_token=' + oauth_token;
			
	console.log("onRequestToken!");
	console.log(data);

	self.tokenSecret = token_secret;

	chrome.tabs.create({ 'url' : authURL, selected: true }, function (tab) {
		chrome.tabs.onUpdated.addListener(self.tabListener(tab.id));
	});
};

Client.prototype.getRequestToken = function () {
	var self = this,
		oauth = self.getOAuthClient(),
		success = function (data) {
			self.onRequestToken(data);
		},
		failure = function (data) {
			console.log("Fail!");
			console.log(data);
		};

	oauth.request({'method': 'GET', 'url': self.serviceHost + '/oauth', 'success': success, 'failure': failure});	
};

Client.prototype.onAuthToken = function (data) {
	var self = this,
		params = self.getParamValues(data.text, [ 'oauth_token', 'edam_userId', 'expires', 'edam_noteStoreUrl' ]),
		oauthToken = decodeURIComponent(params.oauth_token),
		userId = params.edam_userId,
		expires = params.expires,
		noteStoreUrl = decodeURIComponent(params.edam_noteStoreUrl),
		evernote_credentials = {
			oauth_token: oauthToken,
			user_id: userId,
			expires: expires,
			note_store_url: noteStoreUrl	
		};

	console.log("onAuthToken!");
	console.log(data);
	console.log(evernote_credentials);

	chrome.storage.local.set({'evernote_credentials': evernote_credentials}, function () {
    	console.log('set evernote_credentials: ' + evernote_credentials);
    });
};

Client.prototype.getAuthToken = function (oauth_token, oauth_verifier) {
	var self = this,
		tokenSecret = self.tokenSecret,
		oauth = self.getOAuthClient(),
		success = function (data) {
			self.onAuthToken(data);
		},
		failure = function (data) {
			console.log("Fail!");
			console.log(data);
		};

	oauth.setVerifier(oauth_verifier);
	oauth.setAccessToken([oauth_token, tokenSecret]);

	oauth.request({'method': 'GET', 'url': self.serviceHost + '/oauth', 'success': success, 'failure': failure});	
};

Client.prototype.getOAuthClient = function () {
	var self = this,
		oauth = self.oauth;

	if (oauth === undefined || oauth === null) {
		oauth = OAuth({
			consumerKey: self.consumerKey,
    		consumerSecret: self.consumerSecret,
    		callbackUrl : chrome.extension.getURL(self.callbackUrl),
    		signatureMethod : "HMAC-SHA1"
		});
	}
	
	return oauth;
};

Client.prototype.getParamValues = function(url, keys) {
	var params = url.split('&'),
        objKeys = { },
        result = { },
        i,
        temp;
    
    for (i = 0; i < keys.length; i += 1) {
        objKeys[keys[i]] = '';
    }
    
    for (i = 0; i < params.length; i += 1) {
        temp = params[i].split('=');
        
        if (temp[0] in objKeys) {
            result[temp[0]] = temp[1];    
        }
    }
    
    return result;	
};
