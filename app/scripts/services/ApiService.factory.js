(function() {
'use strict';


angular.module('Services', [])

.factory('ApiService', [
	'$resource',
	ApiServiceFactory
]);


function ApiServiceFactory($resource){

	var baseURL = 'http://hangman.coursera.org';


	return function(input){

		var data = (input)? JSON.stringify({'guess': input}) : JSON.stringify({'email': 'test@gmail.com'});

		return $resource(baseURL + '/hangman/game/:key',
	    	{
	    		callback: "JSON_CALLBACK"
	    	},
	   		{
	   			get:
	   				{
	   					method: "JSONP",
	   					params: {
	   						data: data
	   					}
	   				}
	   		}
	   	);
	}
}

}());