(function() {
'use strict';

angular.module('Controllers', [])
    .controller('courseraCtrl', [
        '$scope',
        'GameList',
        courseraCtrl
]);



function courseraCtrl($scope, GameList) {

    $scope.GameList = GameList;

    $scope.createGame = function(){
        GameList.add()
        .catch(function (err) {
            $scope.errorMessage = err.data.message || err.data || err;
        });
    }

}

}());