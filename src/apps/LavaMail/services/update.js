module.exports = function ($rootScope, $http, co, utils, consts, router, dialogs, user) {
	const self = this;

	self.initialize = () => {
		co(function *(){
			while (true) {
				yield utils.sleep(10000);

				if (router.isOpenedDialog())
					continue;

				let manifest = null;
				try {
					let r = yield $http.get('/manifest.json');
					manifest = r.data;
					if (!manifest || !manifest.version)
						continue;

				} catch (err) {
					continue;
				}

				console.log(manifest);

				console.log('update: compare', manifest.version, $rootScope.manifest.version);

				if (utils.cmpSemver(manifest.version, $rootScope.manifest.version) === 1) {
					let isLogoutRequired = manifest.logout.some(lv => utils.cmpSemver(lv, $rootScope.manifest.version) === 1);

					const res = yield co.def(dialogs.create(
						'LavaMail/misc/update',
						'CtrlUpdate',
						{
							isLogoutRequired
						}
					).result, 'cancelled');

					if (res == 'no') {
						yield utils.sleep(consts.UPDATE_REMIND_AFTER);
						continue;
					}

					user.logoutFromMemory();

					location.reload(true);
				}
			}
		});
	};
};