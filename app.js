var createError = require('http-errors');
var express = require('express');
const session = require('express-session');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const passport = require('passport');
const flash = require('connect-flash');
const MongoStore = require('connect-mongo'); 
const sitemap = require('sitemap');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const animeModel = require('./routes/animeDB');
const episodeModel = require('./routes/episodeDB');
const seasonModel = require('./routes/seasonDB');



var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(session({
  secret: 'animeflare_secret_code-4004', 
   resave: true, 
   saveUninitialized: false, 
   store: MongoStore.create({
     mongoUrl: process.env.MONGO_URI
   }),
   cookie: {
     maxAge: 28 * 24 * 60 * 60 * 1000 // 28 days in milliseconds
   }
}));


// Passport initialistion //
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(usersRouter.serializeUser());
passport.deserializeUser(usersRouter.deserializeUser());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/sitemap.xml', (req, res) => {
   // Construct the full path to the sitemap.xml file
   const filePath = path.join(__dirname, 'sitemap.xml');

   // Send the sitemap.xml file
   res.sendFile(filePath);
})


// Use routes
app.use('/', indexRouter);
app.use('/user', usersRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;