(function() {
'use strict';

angular.module('Controllers')
    .controller('hangmanGameCtrl', [
    '$scope',
    'GameList',
    hangmanGameCtrl
    ]);

function hangmanGameCtrl($scope, GameList) {
    $scope.GameList = GameList;

    $scope.opt= {};
    // Keep the record of guessed letters
    $scope.opt.guessed = '';
    $scope.errorMessage = '';

    $scope.submit = function(){
        // Check the single letter or not, case insensitive
        if ($scope.opt.input && $scope.opt.input.length === 1 && $scope.opt.input.match(/[a-zA-Z]/)) {
            $scope.opt.input = $scope.opt.input.toLowerCase();
            // Check input before or not
            if ($scope.opt.guessed.indexOf($scope.opt.input) === -1) {
                $scope.opt.guessed += $scope.opt.input + ' ,';

                GameList.update($scope.game.game_key, $scope.opt.input).then(function(){
                    $scope.errorMessage = '';
                }, function(err) {
                    $scope.errorMessage = err.data || err;
                });
            } else {
                $scope.errorMessage = 'Guessed Before';
            }

            $scope.opt.input = '';

        } else {
            $scope.opt.input = '';
            $scope.errorMessage = 'Please input single letter';
        }
    }

    // Restart the game if lose or win the game
    $scope.restart = function(){
        GameList.del($scope.game).then(function(){
            GameList.add()
            .catch(function (err) {
                $scope.errorMessage = err.data.message || err.data || err;
            });
        })
    }

    //Close the game
    $scope.close = function(){
        GameList.del($scope.game);
    }
}

}());
