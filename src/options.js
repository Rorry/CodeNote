window.onload = function () {
  var USER_STORES = {
      'sandbox': 'https://sandbox.evernote.com/edam/user',
      'evernote': 'https://www.evernote.com/edam/user'
    },
    setName = function () {
      chrome.storage.local.get(['evernote_host', 'evernote_credentials'], function (items) {
        var evernote_host = items.evernote_host || 'evernote',
          evernote_credentials = (items.evernote_credentials && items.evernote_credentials[evernote_host]) || null,
          userStoreURL = USER_STORES[evernote_host],
          authenticationToken,
          noteStoreTransport,
          noteStoreProtocol,
          userStore;

        if (evernote_credentials !== undefined && evernote_credentials !== null) {
          authenticationToken = evernote_credentials.oauth_token;
          noteStoreTransport = new Thrift.BinaryHttpTransport(userStoreURL);
          noteStoreProtocol = new Thrift.BinaryProtocol(noteStoreTransport);
          userStore = new UserStoreClient(noteStoreProtocol);

          userStore.getUser(authenticationToken, function (user) {
            document.getElementById('name').value = user.username;
          }, function onerror (error) {
            console.log(error);
          });
        }
      });
    },
    setHost = function () {
      var hostSelect = document.getElementById('host');

      chrome.storage.local.get('evernote_host', function (items) {
        hostSelect.value = items.evernote_host || 'evernote';

        hostSelect.onchange = function () {
          var value = hostSelect.options[hostSelect.selectedIndex].value;

          chrome.storage.local.set({ 'evernote_host': value }, function () {
            document.getElementById('name').value = '';
            setName();
          });
        };
      });
    };

  setName();
  setHost();

  document.getElementById('logout').onclick = function() {
    chrome.storage.local.set({ 'evernote_credentials': null }, function () {
      document.getElementById('name').value = '';
    });
  };
};