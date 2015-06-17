module.exports = ($scope, $timeout, $translate,
				  dialogs, router, co, utils, user, crypto, cryptoKeys, saver, notifications) => {
	$scope.email = user.email;
	$scope.settings = {};

	$scope.form = {
		oldPassword: '',
		password: '',
		passwordRepeat: ''
	};

	const translations = {
		LB_PASSWORD_CANNOT_BE_CHANGED: '%',
		LB_PASSWORD_CHANGED: '',
		LB_LAVABOOM_SYNC_ACTIVATED: '',
		LB_LAVABOOM_SYNC_DEACTIVATED: '',
		LB_LAVABOOM_SYNC_CANNOT_UPDATE: '',
		TITLE_CONFIRM: '',
		LB_CONFIRM_PASSWORD_CHANGE: ''
	};
	$translate.bindAsObject(translations, 'LAVAMAIL.SETTINGS.SECURITY');

	$scope.$bind('user-settings', () => {
		$scope.settings = user.settings;
	});

	$scope.changePassword = () => co(function *(){
		try {
			const confirmed = yield co.def(dialogs.confirm(translations.TITLE_CONFIRM, translations.LB_CONFIRM_PASSWORD_CHANGE).result, 'cancelled');
			if (confirmed == 'cancelled')
				return;

			yield user.updatePassword($scope.form.oldPassword, $scope.form.password);
			crypto.changePassword(user.email, $scope.form.oldPassword, $scope.form.password);
			yield user.updateLavaboomSync();

			notifications.set('password-changed-ok', {
				text: translations.LB_PASSWORD_CHANGED,
				type: 'info',
				timeout: 3000,
				namespace: 'settings'
			});
		} catch (err) {
			notifications.set('password-changed-fail', {
				text: translations.LB_PASSWORD_CANNOT_BE_CHANGED({error: err.message}),
				namespace: 'settings'
			});
		}
	});

	let updateTimeout = null;
	let isLavaboomSyncRestored = false;
	$scope.$watch('settings.isLavaboomSynced', (o, n) => {
		if (o === n || isLavaboomSyncRestored) {
			isLavaboomSyncRestored = false;
			return;
		}

		co (function *(){
			let LavaboomSyncedKeyring = '';

			if ($scope.settings.isLavaboomSynced) {
				let keysBackup = cryptoKeys.exportKeys(user.email);
				$scope.settings.keyring = keysBackup;
			}
			else
			{
				let backup = utils.def(() => cryptoKeys.verifyAndReadBackup($scope.settings.keyring), null);
				if (backup && backup.prv.length > 0) {
					const confirmed = yield co.def(dialogs.create(
						'LavaMail/misc/lsOff',
						'CtrlLsOff'
					).result, 'cancelled');

					if (confirmed == 'cancelled') {
						isLavaboomSyncRestored = true;
						$scope.settings.isLavaboomSynced = true;
						return;
					}

					LavaboomSyncedKeyring = $scope.settings.keyring;
				}
				$scope.settings.keyring = '';
			}

			if (Object.keys($scope.settings).length > 0) {
				updateTimeout = $timeout.schedulePromise(updateTimeout, () => co(function *(){
					try {
						yield user.update($scope.settings);

						let keys = crypto.clearPermanentPrivateKeysForEmail(user.email);
						console.log('clearPermanentPrivateKeysForEmail returned', keys);
						if ($scope.settings.isLavaboomSynced) {
							crypto.initialize({isShortMemory: true});
						} else {
							crypto.initialize({isShortMemory: false});
						}
						if (LavaboomSyncedKeyring) {
							cryptoKeys.importKeys(LavaboomSyncedKeyring);
							saver.saveAs(LavaboomSyncedKeyring, cryptoKeys.getExportFilename(LavaboomSyncedKeyring, user.name), 'text/plain;charset=utf-8');
						}
						crypto.restorePrivateKeys(...keys);

						notifications.set('ls-ok', {
							text: $scope.settings.isLavaboomSynced ? translations.LB_LAVABOOM_SYNC_ACTIVATED : translations.LB_LAVABOOM_SYNC_DEACTIVATED,
							type: 'info',
							timeout: 3000,
							namespace: 'settings'
						});
					} catch (err) {
						notifications.set('ls-fail', {
							text: translations.LB_LAVABOOM_SYNC_CANNOT_UPDATE,
							namespace: 'settings'
						});
						throw err;
					}
				}), 1000);
			}
		});
	}, true);
};