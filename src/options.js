window.onload = function () {

	chrome.storage.local.get('evernote_credentials', function (items) {
		var evernote_credentials = items.evernote_credentials,
			noteStoreURL = 'https://sandbox.evernote.com/edam/user',
			authenticationToken,
			noteStoreTransport,
			noteStoreProtocol,
			userStore;

		if (evernote_credentials !== undefined && evernote_credentials !== null) {
			authenticationToken = evernote_credentials.oauth_token;
			noteStoreTransport = new Thrift.BinaryHttpTransport(noteStoreURL);
			noteStoreProtocol = new Thrift.BinaryProtocol(noteStoreTransport);
			userStore = new UserStoreClient(noteStoreProtocol);

			userStore.getUser(authenticationToken, function (user) {
				document.getElementById('name').value = user.username;
			}, function onerror (error) {
				console.log(error);
			});
		}
	});

	document.getElementById('logout').onclick = function() {
        chrome.storage.local.set({ 'evernote_credentials': null }, function () {
    		document.getElementById('name').value = '';
    	});
    }
};