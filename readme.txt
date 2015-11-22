Heroku: http://hangmanvictor.herokuapp.com/

github: https://github.com/hanweifish/Hangman

How to install via the zip:
1.npm install
2. npm start


Introduction:
1.	This app based on the angular framework, and host by nodejs
2.	On the web, you can start multiple games at one time, and delete them by simply closing the tab.
3.	Each game created by using angular directive with isolated scope, which can be scale up easily.
4.	Using GameList (GameList.childNodes) service to maintain all the status of the on-going games.  Better solution is to make Game Service as the child of the Gamelist, and both of them can inherit from baseResource and baseResourceList Service, separately. But I thought this is not necessary for this simple app. This structure is better for has the endpoint to store the game_key for each user.
5.	Keep the record of guessed letter for each game. Only post the single letter which has not guessed before.
6.	Simply using the image to show the status of the hangman. SVG may be better for the performance.
7.	All the js files are in the scripts folder, and organized by service/directive/controller.
8.	Manually insert all the js files in the index.html file. Normally we use gulp to do the automatically injection, also for the concatenation and minification.


