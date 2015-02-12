var chan = require('chan');

angular.module(primaryApplicationName).controller('CtrlLavaboomLogin', function($q, $rootScope, $state, $scope, $translate, LavaboomAPI, translate, co, crypto, loader) {
	var translations = {};
	var translationsCh = chan();

	$rootScope.$bind('$translateChangeSuccess', () => {
		translations.LB_INITIALIZING_I18N = $translate.instant('LOADER.LB_INITIALIZING_I18N');
		translations.LB_INITIALIZING_OPENPGP = $translate.instant('LOADER.LB_INITIALIZING_OPENPGP');
		translations.LB_INITIALIZATION_FAILED = $translate.instant('LOADER.LB_INITIALIZATION_FAILED');
		translations.LB_SUCCESS = $translate.instant('LOADER.LB_SUCCESS');

		if ($translate.instant('LANG.CODE') === translate.getCurrentLangCode())
			translationsCh(true);
	});

	$scope.initializeApplication = () => co(function *(){
		try {
			var connectionPromise = LavaboomAPI.connect();

			if (!$rootScope.isInitialized)
				yield translationsCh;

			loader.incProgress(translations.LB_INITIALIZING_I18N, 1);

			translate.initialize();

			loader.incProgress(translations.LB_INITIALIZING_OPENPGP, 5);

			crypto.initialize();

			yield connectionPromise;

			if ($rootScope.isInitialized) {
				yield $state.go('login', {}, {reload: true});
			} else {
				$rootScope.isInitialized = true;
				return {lbDone: translations.LB_SUCCESS};
			}
		} catch (error) {
			throw {message: translations.LB_INITIALIZATION_FAILED, error: error};
		}
	});
});