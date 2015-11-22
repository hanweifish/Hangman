(function() {
'use strict';


angular.module('Services')

.factory('GameList', [
	'$resource',
	'$q',
	'ApiService',
	GameListFactory
]);

function GameListFactory($resource, $q, ApiService) {
	function GameList(){
		this.url = '';
		this.name = 'Game Lists';
		this.childNodes = {};
	}

    /**
     * add new game as child in the list
     * @param {objToAdd} - added childnode from the response
     * @returns promise
     */
	GameList.prototype.add = function(objToAdd){
        return ApiService().get().$promise
        .then(this.addChild.bind(this));
	}

    /**
     * update the game and update the childnodes in the list as well
     * @param {game_key, input} - to guess and update the corsponidng game
     * @returns promise
     */
	GameList.prototype.update = function(game_key, input){
        return ApiService(input).get({key: game_key}).$promise
        .then(this.updateChild.bind(this));
	}

    /**
     * delete the game in the list
     * @param {child} - delete the childnode in the Gamelist
     * @returns promise
     */
	GameList.prototype.del = function(child){
        var deferred = $q.defer();
        if (this.childNodes[child.game_key] === undefined) {return deferred.reject();}
        deferred.resolve(delete this.childNodes[child.game_key]);
        return deferred.promise;
	}

    /**
     * add the childnode in the list
     * @param {child} - add the childnode in the Gamelist
     * @returns boolean
     */
    GameList.prototype.addChild = function(obj) {
    	var child = this.parse(obj);
        if (this.childNodes[child.game_key] !== undefined) { return false }
        this.childNodes[child.game_key] = child;
        return true;
    }

    /**
     * update the childnode in the list based on the new data from server
     * @param {obj} - update the childnode in the Gamelist
     * @returns boolean
     */
    GameList.prototype.updateChild = function(obj) {
    	var child = this.parse(obj);
        if (this.childNodes[child.game_key] === undefined) { return false }
        this.childNodes[child.game_key] = child;
        return true;
    }

    /**
     * helper function to parse the data from server
     * @param {obj} - parse the data to required format from server
     * @returns parsed object
     */
	GameList.prototype.parse = function(obj) {
		return {
            game_key: obj['game_key'],
            num_tries_left: parseInt(obj['num_tries_left']) + 1,
            phrase: obj['phrase'],
            state: obj['state']
        };
	}


	return new GameList();
}

}());