angular.module(primaryApplicationName).directive('dropzone', function () {
	return function (scope, element, attrs) {
		var config, dropzone;

		config = scope[attrs.dropzone];

		console.log('Creating new dropzone', config);

		// create a Dropzone for the element with the given options
		dropzone = new Dropzone(element[0], config.options);

		// bind the given event handlers
		angular.forEach(config.eventHandlers, function (handler, event) {
			dropzone.on(event, handler);
		});
	};
});