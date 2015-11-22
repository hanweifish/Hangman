(function() {
'use strict';

angular.module('Directive')
.directive('gameGraph', [function () {
    return {
        restrict: 'E',
        templateUrl: 'scripts/directive/gameGraph.tpl.html',
        link: linkFunc,
        scope: {
        	nums: '='
        },
        controller: 'gameGraphCtrl'
    };
}])

function linkFunc (scope, elem, attrs) {
}

}());