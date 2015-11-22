(function() {
'use strict';

angular.module('Controllers')
  .controller('gameGraphCtrl', [
    '$scope',
    gameGraphCtrl
]);

function gameGraphCtrl($scope) {

  $scope.imageSrc = 'images/hangman' + $scope.nums + '.jpg';

  $scope.$watch('nums', function(newVal){
    $scope.imageSrc = 'images/hangman' + newVal + '.jpg';
  })

}

}());