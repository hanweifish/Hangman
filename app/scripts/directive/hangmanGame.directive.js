(function() {
'use strict';

angular.module('Directive', [])
.directive('hangmanGame', [function () {
    return {
        restrict: 'E',
        templateUrl: 'scripts/directive/hangmanGame.tpl.html',
        scope: {
        	game: '='
        },
        controller: 'hangmanGameCtrl',
        link: linkFunc
    };
}])

function linkFunc (scope, elem, attrs) {
	var element = elem.children('input');

	// When Enter, submit the input also.
	element.on("keydown", function (event) {
		if(event.which === 13) {
			scope.submit();
			scope.$apply();
		}
	});
}

}());