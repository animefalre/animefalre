var createError = require('http-errors');
var express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const passport = require('passport');
const flash = require('connect-flash');
const cors = require('cors');


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(session({
  store: new MongoStore({ 
      url: process.env.MONGO_URI,
  }),
  secret: 'session-code-10101',
  resave: false,
  saveUninitialized: false,
  cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      secure: true, 
      httpOnly: true,
  }
}));

// Express session and Passport initialistion //
// app.use(session({
//   resave: false,
//   saveUninitialized: false,
//   secret: "session-code-10101"
// }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(usersRouter.serializeUser());
passport.deserializeUser(usersRouter.deserializeUser());


// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: 'https://recall-web-url.web.app'
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Use routes
app.use('/', indexRouter);
app.use('/user', usersRouter);
// app.use('/anime', animeRouter);
// app.use('/episode', episodeRouter);
// app.use('/season', seasonRouter);
// app.use('/banner', bannerRouter);
// app.use('/multer', multerRouter);
// app.use('/comment', commentRouter);
// app.use('/admin', adminRouter);

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
