var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require('cors');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(cors());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/static', express.static(path.join(__dirname, 'app')));
app.use(express.static(path.join(__dirname, 'bower_components')));

app.get('/itm/:itemId', function(req, res){
    res.sendfile('index.html', {root: './app'});
})

var port = process.env.PORT || 3003;

var server = app.listen(port, function () {
  var host = server.address().address;
  console.log('Example server listening at http://%s:%s', host, port);
})

module.exports = app;
