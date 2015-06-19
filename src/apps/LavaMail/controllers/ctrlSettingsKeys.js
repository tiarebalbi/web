module.exports = ($scope, $timeout, $translate, $state,
				  Key, dialogs, router, co, user, crypto, cryptoKeys, inbox, saver, notifications) => {

	const translations = {
		LB_PASSWORDS_SHOULD_MATCH: '',
		LB_PASSWORD_REQUIRED: '',
		LB_CONFIRM_KEYS_REMOVAL: '',
		LB_CANNOT_IMPORT: '',
		LB_CANNOT_IMPORT_WRONG_FORMAT: '',
		LB_CANNOT_IMPORT_CORRUPTED: '',
		LB_CANNOT_IMPORT_NO_PRIVATE_KEYS_FOUND: '',
		LB_CANNOT_IMPORT_UNEXPECTED_KEY_TYPE_FOUND: '',
		LB_CANNOT_IMPORT_LS_ERROR: '',
		LB_IMPORTED: '%'
	};
	$translate.bindAsObject(translations, 'LAVAMAIL.SETTINGS.SECURITY');

	$scope.$bind('keyring-updated', () => {
		$scope.keys = crypto.getAvailablePrivateKeys()
			.map(key => {
				let k = new Key(key);
				k.email = user.styleEmail(k.email);
				return k;
			})
			.sort((a, b) => {
				if (a.keyId < b.keyId) return -1;
				if (a.keyId > b.keyId) return 1;
				return 0;
			});
		$scope.isAnyUndecryptedKeys = $scope.keys.some(k => !k.isDecrypted);

		console.log('keyring-updated', $scope.keys);
	});

	$scope.exportKeys = () => {
		var keysBackup = cryptoKeys.exportKeys();
		saver.saveAs(keysBackup.backup, cryptoKeys.getExportFilename(keysBackup.hash, user.name), 'text/plain;charset=utf-8');
	};

	$scope.generateKeys = () => {
		loader.resetProgress();
		loader.showLoader(true);
		loader.loadLoginApplication({state: 'choosePasswordIntro', noDelay: true});
	};

	$scope.removeDecryptedKeys = () => co(function *(){
		const confirmed = yield co.def(dialogs.confirm(translations.TITLE_CONFIRM, translations.LB_CONFIRM_KEYS_REMOVAL).result, 'cancelled');
		if (confirmed == 'cancelled')
			return;

		crypto.removeSensitiveKeys(true);
	});

	$scope.exportKeys = () => {
		var keysBackup = cryptoKeys.exportKeys();
		saver.saveAs(keysBackup.backup, cryptoKeys.getExportFilename(keysBackup.hash, user.styledName), 'text/plain;charset=utf-8');
	};

	$scope.exportPublicKey = (key) => {
		saver.saveAs(cryptoKeys.exportPublicKeyByFingerprint(key.fingerprint), key.email + '.asc', 'text/plain;charset=utf-8');
	};

	$scope.sendKey = (key) => {
		router.showPopup('compose', {publicKey: key.fingerprint});
	};

	$scope.importKeys = (data) => {
		co(function *(){
			try {
				let c = cryptoKeys.importKeys(data);

				if (c < 1) {
					notifications.set('import-keys', {
						text: translations.LB_CANNOT_IMPORT_NO_PRIVATE_KEYS_FOUND,
						type: 'warning',
						namespace: 'settings',
						kind: 'crypto'
					});
				} else {
					yield user.updateLavaboomSync();

					notifications.set('import-keys', {
						text: translations.LB_IMPORTED({count: c}),
						namespace: 'settings',
						kind: 'crypto'
					});
				}
			} catch (err) {
				console.log('cannot import', err.message);
				const translatedErrorMessage = translations['LB_CANNOT_IMPORT_' + err.message];

				notifications.set('import-keys', {
					text: translatedErrorMessage ? translatedErrorMessage : translations.LB_CANNOT_IMPORT,
					type: 'warning',
					namespace: 'settings',
					kind: 'crypto'
				});
			}
			inbox.invalidateEmailCache();
		});
	};
};