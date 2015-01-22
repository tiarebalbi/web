angular.module('AppLavaboom').controller('CtrlCompose', function($scope) {

      $scope.disabled = undefined;
	  $scope.searchEnabled = undefined;

	  $scope.enable = function() {
	    $scope.disabled = false;
	  };

	  $scope.disable = function() {
	    $scope.disabled = true;
	  };

	  $scope.enableSearch = function() {
	    $scope.searchEnabled = true;
	  };

	  $scope.disableSearch = function() {
	    $scope.searchEnabled = false;
	  };

	  $scope.clear = function() {
	    $scope.person.selected = undefined;
	    $scope.address.selected = undefined;
	    // $scope.country.selected = undefined;
	  };






	  $scope.tagTransform = function (newTag) {
	    var item = {
	        name: newTag,
	        email: newTag.toLowerCase()+'@email.com',
	        sec: 'unknown'
	    };

	    return item;
	  };

	  $scope.person = {};

	  $scope.people = [
	    { name: 'Adam',      email: 'adam@email.com',      sec: 1},
	    { name: 'Amalie',    email: 'amalie@email.com',    sec: 0},
	    { name: 'Estefania', email: 'estefania@email.com', sec: 0},
	    { name: 'Adrian',    email: 'adrian@email.com',    sec: 1},
	    { name: 'Wladimir',  email: 'wladimir@email.com',  sec: 1},
	    { name: 'Samantha',  email: 'samantha@email.com',  sec: 0},
	    { name: 'Nicole',    email: 'nicole@email.com',    sec: 1},
	    { name: 'Natasha',   email: 'natasha@email.com',   sec: 1},
	    { name: 'Michael',   email: 'michael@email.com',   sec: 0},
	    { name: 'Nicolas',   email: 'nicolas@email.com',    sec: 0}
	  ];

	  

	  $scope.composeSelected = {};
	  
	  $scope.composeSelected.to = [$scope.people[5], $scope.people[4]];
	  $scope.composeSelected.cc = [];
	  $scope.composeSelected.bcc = [];

	  $scope.htmlVariable = '<p>Dear Orwell</p><p>Curabitur non nulla sit amet nisl tempus convallis quis ac lectus. Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus. Sed porttitor lectus nibh. Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus. Donec sollicitudin molestie malesuada. Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus. Donec rutrum congue leo eget malesuada. Sed porttitor lectus nibh. Curabitur aliquet quam id dui posuere blandit. Nulla porttitor accumsan tincidunt.</p><blockquote><p>See, there never was actually any spoon. It was just lying around the production set.</p></blockquote><p>Sincerely</p><p>Al Coholic<br/>C.E.O<br/>Starship Enterprise(s)</p>';


	  $scope.fromEmails = [{mail: "piggyslasher@lavaboom.com"}, {mail:"bubba@shrimp.com"}, {name:"wholet@dog.out"}];
	  $scope.fromEmails.selected = {mail: "piggyslasher@lavaboom.com"};

	
});