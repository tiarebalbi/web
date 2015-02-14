module.exports = ($stateProvider, $urlRouterProvider, $locationProvider) => {
	$locationProvider.hashPrefix('!');

	// small hack - both routers(login && main app) work at the same time, so we need to troubleshot this
	$urlRouterProvider.otherwise(($injector, $location) => {
		console.log('main router otherwise: window.loader.isMainApplication()', window.loader.isMainApplication(), $location);
		if (!window.loader.isMainApplication())
			return undefined;
		return '/label/Inbox';
	});

	var primaryStates = {
		'empty': {
			url: '/'
		},

		'modal' : {
			url: '/modal'
		},

		'main': {
			abstract: true,

			views: {
				'left-view': {
					templateUrl: 'partials/left_panel.html',
					controller: 'CtrlNavigation'
				}
			}
		},

		'main.inbox': {
			abstract: true,
			views: {
				'main-view@': {
					templateUrl: 'partials/inbox.html'
				}
			}
		},

		'main.inbox.label': {
			url: '/label/:labelName?threadId',

			views: {
				'threads@main.inbox': {
					templateUrl: 'partials/inbox/threads.html',
					controller: 'CtrlThreadList'
				},
				'emails@main.inbox': {
					templateUrl: 'partials/inbox/emails.html',
					controller: 'CtrlEmailList'
				}
			}
		},

		'main.contacts' : {
			url: '/contacts',
			views: {
				'main-view@': {
					templateUrl: 'partials/contacts.html'
				}
			}
		},

		'main.contacts.profile': {
			url: '/profile/:contactId',
			templateUrl: 'partials/contacts/contacts.profile.html',
			controller: 'CtrlContactProfile'
		},

		'main.settings' : {
			url: '/settings',
			views: {
				'main-view@': {
					templateUrl: 'partials/settings.html'
				}
			}
		},

		'main.settings.general': {
			url: '/general',
			templateUrl: 'partials/settings/settings.general.html'
		},

		'main.settings.profile': {
			url: '/profile',
			templateUrl: 'partials/settings/settings.profile.html'
		},

		'main.settings.security': {
			url: '/security',
			templateUrl: 'partials/settings/settings.security.html'
		},

		'main.settings.plan': {
			url: '/plan',
			templateUrl: 'partials/settings/settings.plan.html'
		}
	};

	var PopupAbstractState = function () {
		this.abstract = true;
	};

	var popupStates = {
		'compose': function () {
			this.url =  '/compose?replyThreadId&to';

			// @ngInject
			this.onEnter = (router) => {
				router.createPopup({
					templateUrl: 'partials/compose.html',
					controller: 'CtrlCompose',
					backdrop: true,
					size: 'lg'
				});
			};

			// @ngInject
			this.onExit = (router) => {
				router.hidePopup();
			};
		}
	};

	var declareState = (name, state) => {
		console.log('creating state ', name);
		$stateProvider.state(name, state);
	};

	for(let stateName in primaryStates) {
		declareState(stateName, primaryStates[stateName]);

		if (!primaryStates[stateName].abstract) {
			declareState(`${stateName}.popup`, new PopupAbstractState());
			for (let popupStateName in popupStates)
				if (stateName.indexOf('main.') === 0) {
					declareState(`${stateName}.popup.${popupStateName}`, new popupStates[popupStateName]());
				}
		}
	}
};
