module.exports = ($scope, $modalInstance, data) => {
	$scope.isLogoutRequired = data.isLogoutRequired;

	$scope.no = function(){
		$modalInstance.close('no');
	};

	$scope.yes = function(){
		$modalInstance.close('yes');
	};
};