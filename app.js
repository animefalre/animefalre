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
const { Animes, Seasons, Episodes } = require('./animeService');

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


// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Use routes
app.use('/', indexRouter);
app.use('/user', usersRouter);

// Dynamic sitemap generation
app.get('/sitemap.xml', async (req, res) => {
  try {

    const animeList = await Animes();
    const seasonList = await Seasons();
    const episodeList = await Episodes();

      // Generate URLs for sitemap
      const urls = [
        { url: '/home', changefreq: 'daily', priority: 1.0 },
        { url: '/', changefreq: 'monthly', priority: 0.8 },
        { url: '/login', changefreq: 'monthly', priority: 0.8 },
        { url: '/register', changefreq: 'monthly', priority: 0.8 },
        { url: '/about', changefreq: 'monthly', priority: 0.8 },
        { url: '/privacy-policy', changefreq: 'monthly', priority: 0.8 },
      ];

      // Add dynamic URLs for anime details
      seasonList.forEach(season => {
          const { animeId, seasonId } = season;
              urls.push({
                  url: `/anime/detail/${animeId}/${seasonId}`,
                  changefreq: 'monthly',
                  priority: 0.9
          });
      });

      // Add dynamic URL for watching anime
      episodeList.forEach(episode => {
          const { animeId, season, episodeId } = episode;
                  urls.push({
                      url: `/anime/watch/${animeId}/${season}/${episodeId}`,
                      changefreq: 'daily',
                      priority: 1.0
                  });
              });

      const sm = sitemap.createSitemap({
          hostname: 'https://animeflare.us.to',
          cacheTime: 600000, // 600 sec - cache purge period
          urls: urls
      });

      sm.toXML((err, xml) => {
          if (err) {
              return res.status(500).end();
          }
          res.header('Content-Type', 'application/xml');
          res.send(xml);
      });
  } catch (err) {
      res.status(500).send('Error generating sitemap');
  }
});

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
