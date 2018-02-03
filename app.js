var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var compression = require('compression');
var helmet = require('helmet');

var index = require('./routes/index');
var users = require('./routes/users');
var catalog = require('./routes/catalog');
var err_routes = require('./middlewares/error_routes');

var app = express();
// Set up mongoose connection
var mongoDB = 'mongodb://micah:ndidi1234@ds255787.mlab.com:55787/local-library';
mongoose.connect(mongoDB, {
    useMongoClient: true
});

mongoose.Promise = global.Promise;
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(helmet());
// Compress all routes
app.use(compression());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/catalog', catalog); // Add catalog routes to middleware chain.


// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   var err = Error('Not Found');
//   err.status = 404;
//   next(err);
// });

app.use(err_routes.error404);

// error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};
//   console.log(req.app.get('env'));
//   console.log(err.status);

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

app.use(err_routes.errorHandler);

module.exports = app;
