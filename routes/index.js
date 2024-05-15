var express = require('express');
var router = express.Router();
const userModel = require('./users');
const cloudinary = require("cloudinary").v2;
const passport = require('passport');
const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));
const { upload, handleImageUpload } = require("./multer");
const animeModel = require('./animeDB');
const episodeModel = require('./episodeDB');
const bannerModel = require('./bannerDB');
const commentModel = require('./commentDB');
const seasonModel = require('./seasonDB');
const adminModel = require('./admin');
const sitemap = require('sitemap');

router.get('/check-server-health', (req, res) => {
  return res.sendStatus(200); 
})

// Dynamic sitemap generation
router.get('/sitemap.xml', async (req, res) => {
  try {
    const animeList = await animeModel.find();
    const seasonList = await seasonModel.find();
    const episodeList = await episodeModel.find();

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


/* intro page. */
router.get('/', function(req, res, next) {
  res.render('index');
});
router.get('/index', function(req, res, next) {
  res.render('index');
});

// login page
router.get('/login', function(req, res, next) {
  res.render('login', {error: req.flash('error')});
});


// Register page route
router.get('/register', function(req, res, next) {
  res.render('register', { 
    error: req.flash('error'), 
    success: req.flash('success') 
  });
});

// privacy policy page
router.get('/privacy-policy', async function(req, res, next) {

  if (req.isAuthenticated()) {
    const user = await userModel.findOne({
      username: req.session.passport.user});
      res.render('privacy', { user });
    } else {
      const user = null;
      res.render('privacy', { user });
    }
});

// about page
router.get('/about', async function(req, res, next) {
  let user;
  if (req.isAuthenticated()) {
    user = await userModel.findOne({
      username: req.session.passport.user});
  } else {
    user = null;
  }
  res.render('about', { user });
});


// header page
router.get('/header005', async function(req, res, next) {
  let user;
  if (req.isAuthenticated()) {
    user = await userModel.findOne({
      username: req.session.passport.user});
  } else {
    user = null;
  }


  res.render('./components/header', { user });
});

// Account page
router.get('/account/:username', isLoggedIn, async function(req, res, next) {
  const username = req.params.username;
  const user = await userModel.findOne({
    username: req.session.passport.user, username: username});
  res.render('account', { user });
});


// Route to handle search suggestions based on tags
router.get('/search-suggestions', async (req, res) => {
  try {
    const query = req.query.query.toLowerCase();
    
    // Use Mongoose to find anime with tags matching the query
    const suggestions = await animeModel.find({ tags: { $regex: query, $options: 'i' } }, 'animeId name season');
    
    // Extract only the names from the results
    const animeTitles = suggestions.map(anime => {
      const lastSeason = anime.season.length > 0 ? anime.season.length : 1;
      return {
        animeId: anime.animeId,
        seasonId: `S${lastSeason}`,
        name: anime.name
      };
    });

    res.json(animeTitles);
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    res.status(500).render('error');
  }
});

// Home page route
router.get('/home', async function(req, res, next) {
  try {
    let user;
    if (req.isAuthenticated()) {
      user = await userModel.findOne({
        username: req.session.passport.user});
    } else {
      user = null;
    }  

    const today = new Date();
    console.log(today);
    today.setHours(0, 0, 0, 0); // Set time to midnight

    const animeData = await animeModel.find();

    const episodeData = await episodeModel.find();

    const todayEpisodes = await episodeModel.find({
      createdAt: { $gte: today } // Find episodes created today or later
    }).sort({ createdAt: -1 }).exec();

    const banner = await bannerModel.find().sort({ createdAt: -1 }).limit(5).exec();

    const popularAnime = await animeModel.find({ section: "popular" }).populate("season").sort({ views: -1 }).limit(6).exec();

    const recentAnime = await animeModel.find({ section: "new" }).sort({ createdAt: -1 }).limit(5).exec();

    const otherAnime = await animeModel.find({ section: "others" }).sort({ views: 1 }).limit(7).exec();

    res.render('home', {
      episodeData: episodeData,
      animeData: animeData,
      todayEpisodes: todayEpisodes,
      banner: banner,
      popularAnime: popularAnime,
      recentAnime: recentAnime,
      otherAnime: otherAnime,
      user: user
    });
  } catch (error) {
    // Handle any errors that occur during data fetching
    console.error('Error fetching data:', error);
    res.status(500).render('error');
  }
});


// Anime detail page
router.get('/anime/detail/:animeId/:seasonId', async function(req, res, next) {
  try {
    const animeId = req.params.animeId;
    const seasonId = req.params.seasonId;
    
    let user;
    if (req.isAuthenticated()) {
      user = await userModel.findOne({
        username: req.session.passport.user});
    } else {
      user = null;
    }  

    const animeData = await animeModel.findOne({ animeId: animeId })
    .populate("season");
    const seasonData = await seasonModel.findOne({ animeId: animeId, seasonId: seasonId })
    .populate("episodes");

    if (!animeData || !seasonData) {
      return res.status(404).redirect('/not-found');
    } else {
      res.render('animeDetails', { animeData: animeData, seasonData: seasonData, user: user });
    }

    
  } catch (error) {
    console.error('Error fetching anime details:', error);
    res.status(500).render('error');
  }
});


// Anime watch page
router.get('/anime/watch/:animeId/:seasonId/:episodeId', async function(req, res, next) {
  try {
    const animeId = req.params.animeId;
    const seasonId = req.params.seasonId;
    const episodeId = req.params.episodeId;

    let user;
    if (req.isAuthenticated()) {
      user = await userModel.findOne({
        username: req.session.passport.user});
    } else {
      user = null;
    }

    const animeData = await animeModel.findOne({ animeId: animeId }).populate("season");
    const seasonData = await seasonModel.findOne({ animeId: animeId, seasonId: seasonId }).populate("episodes");

    if (!animeData || !seasonData) {
      return res.status(404).redirect('/not-found');
    }

    const episodeData = await episodeModel.findOne({ animeId: animeId, season: seasonId, episodeId: episodeId }).populate('comments');

    if (!episodeData) {
      return res.redirect('back');
    }

    const tags = ['action', 'romance', 'drama', 'cultivation', 'superpower'];
    const relatedAnime = await animeModel.find({
      tags: { $regex: tags.join('|'), $options: 'i' }
    }).populate("season").sort({ createdAt: -1 }).limit(6).exec();

    // New Comments
    const newComment = await commentModel.find().sort({ createdAt: -1 }).limit(8).exec();

    res.render('watchPage', { animeData: animeData, seasonData: seasonData, episodeData: episodeData, user: user, relatedAnime: relatedAnime, newComment: newComment });
  } catch (error) {
    console.error('Error fetching anime details:', error);
    res.status(500).render('error');
  }
});

// Not Found
router.get('/not-found', async (req, res) => {
  const user = await userModel.findOne({
    username: req.session.passport.user});

  res.render('notFound', {user: user});
})

// Upload Comment
router.post('/comment', async (req, res) => {
  try {
    const animeId = req.body.animeId;
    const seasonId = req.body.seasonId;
    const episodeId = req.body.episodeId;
    
    if (!animeId) {
      return res.status(404).send("Anime ID doesn't exist");
    }
    if (!seasonId) {
      return res.status(404).send("Season ID doesn't exist");
    }
    if (!episodeId) {
      return res.status(404).send("Episode ID doesn't exist");
    }
    console.log(`Comment processing on Anime: ${animeId}, Season: ${seasonId}, Episode: ${episodeId}`)

    const episode = await episodeModel.findOne({ animeId: animeId, season: seasonId, episodeId: episodeId });
    if (!episode) {
      return res.status(404).send("Episode not found");
    }


    const newComment = await commentModel.create({
      userPic: req.body.userPic,
      username: req.body.username,
      text: req.body.text,
      episodeId: episodeId,
      seasonId: seasonId,
      animeId: animeId
    });

    if (!episode.comments) {
      episode.comments = [];
    }
    episode.comments.push(newComment._id);

    await episode.save();

    res.redirect(req.headers.referer + '#comment-section');
  } catch (error) {
    console.error('Error uploading comment:', error);
    res.status(500).send('Error uploading comment.');
  }
});



// Account Update
router.post('/account-update', upload.single('profileImg'), handleImageUpload, async function(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).send('No file was uploaded.');
    }

    const username = req.user.username;
    const userPic = req.imageURL;

    const user = await userModel.findOne({ username: username });
    const previousPicUrl = user.userPic;

    if (previousPicUrl) {
      const publicId = extractPublicId(previousPicUrl);

      await cloudinary.uploader.destroy(publicId);
    }

    const updatedUser = await userModel.findOneAndUpdate(
      { username: username },
      { $set: { userPic: userPic } },
      { new: true }
    );

    res.redirect('/account/' + username );
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).render('error');
  }
});

function extractPublicId(url) {
  const startIndex = url.lastIndexOf("/") + 1;
  const endIndex = url.lastIndexOf(".");
  return url.substring(startIndex, endIndex);
}

// Admin login form route
router.get('/admin/login', function(req, res) {
  res.render('adminLock');
});

// Admin login form submission route
router.post('/admin/login', async function(req, res) {
  const { adminId, password } = req.body;

  try {
    const admin = await adminModel.findOne({ adminId, password });
    if (admin) {
      req.session.isAdminAuthenticated = true;
      res.redirect('/admin/dashboard_code-365');
    } else {
      res.render('adminLock', { error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error finding admin:', error);
    res.status(500).render('error');
  }
});
// Admin data route
router.get("/admindata", async (req, res) => {
  try {
    const request = req.query.selected;

    const anime = await animeModel.findOne({ animeId: request });
    const seasonId = "S" + anime.season.length;
    const season = await seasonModel.findOne({
      animeId: request,
      seasonId: seasonId,
    });
    const episode = await episodeModel.find({
      animeId: request, //btth
      season: seasonId, //S5
    });

    const episodeNo = season.episodes.length + 1;
    console.log(`Season: ${season.seasonId}, episode: ${episodeNo}`);

    res.json({
      season: season.season,
      episode: episode,
      episodeNo: episodeNo,
    });
  } catch (error) {
    console.error("An error occurs in Admin data API: " + error);
    res.status(500).json({ error: "Internal Server Error" }); 
  }
});


// Admin dashboard route
router.get('/admin/dashboard_code-365', requireAdminAuthentication, async function(req, res) {
  try {
    const animeData = await animeModel.find().sort({ name: 1 });;
    const recentUsers = await userModel.find({ allowNotification: true }).sort({ createdAt: -1 }).limit(10);
    const seasonData = await seasonModel.find();
    const episodeData = await episodeModel.find();
    const recentAnime = await animeModel.find().sort({ createdAt: -1 }).limit(7);
    const recentEpisode = await episodeModel.find().sort({ createdAt: -1 }).limit(7);
    const mostViewedEpisode = await episodeModel.find().sort({ views: -1 }).limit(10);

    res.render('admin', { animeData, seasonData, episodeData, recentAnime, recentEpisode, mostViewedEpisode, recentUsers });
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    res.status(500).render('error');
  }
});

function requireAdminAuthentication(req, res, next) {
  if (req.session.isAdminAuthenticated) {
    next();
  } else {
    res.redirect('/admin/login');
  }
}


// Upload banner
router.post('/update-banner', upload.single('bannerImg'), handleImageUpload, async (req, res) => {

    const postLink = req.body.link
    const link = 'anime/deatil/' + postLink;

  try {
      const newBanner = await bannerModel.create({
          bannerImage: req.imageURL,
          animeName: req.body.animeName,
          link: link
      });
      console.log('Banner Updated:', newBanner);
      res.redirect("/admin/dashboard_code-365");
  } catch (error) {
      console.error('Error updating banner:', error);
      res.status(500).send('Error updating banner.');
  }
});

//Upload route
router.post('/upload-donghua', upload.single('posterImg'), handleImageUpload, async function(req, res) {
  const cloudURL = req.body.cloudURL;

  var poster;
  if (!req.file) {
    if (cloudURL) {
      poster = cloudURL;
    } else {
      return res.status(404).send({ error: "Please provide a cloud URL or file" });
    }
  } else {
    poster = req.imageURL;
  }

  const Anime = await animeModel.create({
    poster: poster,
    name: req.body.name,
    description: req.body.description,
    section: req.body.section,
    tags: req.body.tags,
    animeId: req.body.animeId,
    season: req.body.season,
    episodes: req.body.episodes,
    createAt: req.body.createAt,
  })
  res.redirect("/admin/dashboard_code-365" + "#sec_3");
});

// Upload route for episodes
router.post('/upload-episode', upload.single('thumbnail'), handleImageUpload, async function(req, res) {
  try {
    const cloudURL = req.body.cloudURL;

    var thumbnail;
    if (!req.file) {
      if (cloudURL) {
        thumbnail = cloudURL;
      } else {
        return res.status(404).send({ error: "Please provide a cloud URL or file" });
      }
    } else {
      thumbnail = req.imageURL;
    }


    const animeId = req.body.animeId; 
    const season = req.body.season;
    const seasonId = 'S' + season;
    const episodeNo = req.body.episodeNo;
    const episodeId = 'ep' + episodeNo;

    const anime = await animeModel.findOne({ animeId: animeId });
    if (!anime) {
      return res.status(404).send('Anime not found');
    }
    
    const seasonData = await seasonModel.findOne({ animeId: animeId, seasonId: seasonId });
    if (!season) {
      return res.status(404).send('Season not found');
    }

    const episodeTitle = anime.name + ' ep ' + episodeNo;

    const episode = await episodeModel.create({
      episodeTitle: episodeTitle,
      episodeId: episodeId,
      thumbnail: thumbnail,
      animeId: animeId,
      server1: req.body.server1,
      server2: req.body.server2,
      server3: req.body.server3,
      season: seasonId,
      episodeNo: episodeNo
    });

    seasonData.episodes.push(episode._id);
    await seasonData.save();

    anime.episodes.push(episode._id);
    await anime.save();

    res.redirect("/admin/dashboard_code-365" + "#sec_2");
  } catch (error) {
    console.error('Error uploading episode:', error);
    res.status(500).render('error');
  }
});

// views api
router.get("/views", async (req, res, next) => {
  try {
      const { animeId, episodeId, seasonId, viewsNum } = req.query;
      // Increment view count for episode
      const episode = await episodeModel.findOneAndUpdate(
          { animeId: animeId, season: seasonId, episodeId: episodeId }, 
          { $inc: { views: parseInt(viewsNum) } }, 
          { new: true }
      );

      // Increment view count for season
      const season = await seasonModel.findOneAndUpdate(
          { animeId: animeId, seasonId: seasonId }, 
          { $inc: { views: parseInt(viewsNum) } }, 
          { new: true }
      );

      // Increment view count for anime
      const anime = await animeModel.findOneAndUpdate(
          { animeId: animeId }, 
          { $inc: { views: parseInt(viewsNum) } }, 
          { new: true }
      );
      res.status(200).json({ message: "Modules are found and update." });
  } catch (error) {
      console.error("Error updating views:", error);
      res.status(500).json({ error: "Internal server error" });
  }
});

// Update and Delete routes //

  // Create seasons
router.post('/create-season', upload.single('seasonImg'), handleImageUpload, async function(req, res) {
  try {
    const animeId = req.body.animeId; 
    const cloudURL = req.body.cloudURL;
    var seasonImg;
    if (!req.file) {
      if (cloudURL) {
        seasonImg = cloudURL;
      } else {
        return res.status(404).send({ error: "Please provide a cloud URL or file" });
      }
    } else {
      seasonImg = req.imageURL;
    }  
    const animeData = await animeModel.findOne({ animeId: animeId });

    if (!animeData) {
      return res.status(404).send('Anime not found');
    }
    const name = 'Season ' + (animeData.season.length + 1);
    const seasonNo = 'S' + (animeData.season.length + 1);
    const season = animeData.season.length + 1;
    const seasonId = 'S' + season;
    const animeName = animeData.name;
    const newSeason = await seasonModel.create({
      displayName: name, // Season 1
      seasonNo: seasonNo, // S1
      seasonId: seasonId, // S1
      seasonImg: seasonImg, // cdvfcdfv.jpg
      anime: animeName, // Battle through the heaven
      animeId: animeId, // btth
      season: season, // 1
      episode: []
    });

    animeData.season.push(newSeason._id); 
    await animeData.save(); 
    res.redirect("/admin/dashboard_code-365" + "#sec_4");
  } catch (error) {
    console.error('Error uploading episode:', error);
    res.status(500).render('error');
  }
});

// Delete season
router.post('/delete-season', async (req, res) => {
  try {
    const animeId = req.body.animeId; 
    const season = req.body.seasonId;
    const seasonId = 'S' + season; 

    const animeData = await animeModel.findOne({ animeId: animeId });

    if (!animeData) {
      return res.status(404).send('Anime not found');
    }
    const seasonData = await seasonModel.findOneAndDelete({ animeId: animeId, seasonId: seasonId });

    if (!seasonData) {
      return res.status(404).send('Season data not found');
    }

    animeData.season.pull(seasonData._id);
    await animeData.save();

    res.redirect("/admin/dashboard_code-365" + "#sec_4");

  } catch (error) {
    console.error('Error deleting season:', error);
    res.status(500).render('error');
  }
});

// Update Anime
router.post('/update-donghua', upload.single('posterImg'), handleImageUpload, async function(req, res) {
  try {
    let poster;
    if (req.file) {
      poster = req.imageURL;
    }

    const animeId = req.body.animeId;
    let newAnimeId = req.body.newAnimeId;
    let name = req.body.name;
    let tags = req.body.tags;
    let section = req.body.section;

    const existingAnime = await animeModel.findOne({ animeId: animeId });

    if (!newAnimeId) {
      newAnimeId = existingAnime.animeId;
    }
    if (!name) {
      name = existingAnime.name;
    }
    if (!tags) {
      tags = existingAnime.tags;
    }
    if (!section) {
      section = existingAnime.section;
    }
    if (!poster) {
      poster = existingAnime.poster;
    }

    const updatedAnime = await animeModel.findOneAndUpdate(
      { animeId: animeId },
      { $set: { poster: poster, name: name, animeId: newAnimeId, tags: tags, section: section } },
      { new: true }
    );
    
    console.log('Anime updated:', updatedAnime);
    res.redirect("/admin/dashboard_code-365#sec_4");

  } catch (error) {
    console.error('Error updating donghua:', error);
    res.status(500).render('error');
  }
});

// Delete Anime
router.post('/delete-donghua', async (req, res) => {
  try {
    const animeId = req.body.animeId; 
    
    const animeData = await animeModel.findOneAndDelete({ animeId: animeId });

    if (!animeData) {
      return res.status(404).send('Anime not found');
    }

    res.redirect("/admin/dashboard_code-365" + "#sec_4");

  } catch (error) {
    console.error('Error deleting season:', error);
    res.status(500).render('error');
  }
});

// Update Episode
router.post('/update-episode', upload.single('thumbnail'), handleImageUpload, async function(req, res) {
  try {
    let thumbnail;
    if (!req.file) {
      return res.status(400).send('No file was uploaded.');
    } else {
      thumbnail = req.imageURL;
    }

    const animeId = req.body.animeId; 
    const season = req.body.season;
    const seasonId = 'S' + season;
    const episodeId = req.body.episodeId;

    const anime = await animeModel.findOne({ animeId: animeId });
    if (!anime) {
      return res.status(404).send('Anime not found');
    }

    const seasonData = await seasonModel.findOne({ animeId: animeId, seasonId: seasonId });
    if (!seasonData) {
      return res.status(404).send('Season not found');
    }

    const episodeTitle = req.body.episodeTitle || seasonData.episodes.find(episode => episode.episodeId === episodeId).episodeTitle;
    const episodeNo = req.body.episodeNo || seasonData.episodes.find(episode => episode.episodeId === episodeId).episodeNo;
    const server1 = req.body.server1 || seasonData.episodes.find(episode => episode.episodeId === episodeId).server1;
    const server2 = req.body.server2 || seasonData.episodes.find(episode => episode.episodeId === episodeId).server2;

    const updatedEpisode = await animeModel.findOneAndUpdate(
      { animeId: animeId, seasonId: seasonId, episodeId: episodeId },
      { $set: { thumbnail: thumbnail, episodeTitle: episodeTitle, episodeNo: episodeNo, server1: server1, server2: server2 } },
      { new: true }
    );

    console.log('Episode updated:', updatedEpisode);
    res.redirect("/admin/dashboard_code-365#sec_4");

  } catch (error) {
    console.error('Error updating episode:', error);
    res.status(500).render('error');
  }
});

// Delete Episode
router.post('/delete-episode', async (req, res) => {
  try {
    const episodeId = req.body.episodeId; 
    
    const episodeData = await episodeModel.findOne({ episodeId: episodeId });

    const animeId = episodeData.animeId; // btth
    const seasonId = episodeData.season; // S1
    const animeData = await animeModel.findOne({ animeId: animeId });
    if (!animeData) {
      return res.status(404).send('Anime not found');
    }
    
    const seasonData = await animeModel.findOne({ animeId: animeId, seasonId: seasonId });
    if (!seasonData) {
      return res.status(404).send('Season not found');
    }

    const deleteEpisode = await episodeModel.findOneAndDelete({ animeId: animeId, seasonId: seasonId, episodeId: episodeId });

    animeData.episodes.pull(deleteEpisode._id);
    seasonData.episodes.pull(deleteEpisode._id);
    await animeData.save();
    await seasonData.save();


    res.redirect("/admin/dashboard_code-365" + "#sec_4");

  } catch (error) {
    console.error('Error deleting season:', error);
    res.status(500).render('error');
  }
});

router.get("/delete-ep-api", async (req, res) => {
  try {
    const animeId = req.query.animeId;
    const seasonId = req.query.seasonId;
    const episodeId = req.query.episodeId;
    
    const anime = await animeModel.findOne({
      animeId: animeId,
    })
    const season = await seasonModel.findOne({
      animeId: animeId,
      seasonId: seasonId,
    })
    const episode = await episodeModel.findOneAndDelete({
      animeId: animeId,
      season: seasonId,
      episodeId: episodeId,
    })
    if (!anime || !season || !episode) {
      return res.status(404).send("Models are not found");
    }
    anime.episodes.pull(episode._id);
    season.episodes.pull(episode._id);
    await anime.save();
    await season.save();
    
    res.json({episode: `anime: ${animeId}, season: ${seasonId}, EP: ${episodeId}, Successfully deleted`})
  } catch (error) {
    console.error("Error deleting episode in index API:", error);
    return res.status(500).send({error: error});
  }

})


// Login and Register code //
// Register route
router.post('/register', function (req, res) {
  const { username, email, fullname, password, allowNotification } = req.body; 

  if (!password) {
    req.flash('error', 'Password is required');
    return res.status(400).redirect('/register'); 
  }

  const userData = new userModel({ username, email, fullname, password, allowNotification }); 

  userModel.register(userData, password)
    .then(function (registereduser) {
      passport.authenticate("local")(req, res, function () {
        res.redirect('/home');
      });
    })
    .catch(function (err) {
      console.error('Registration error:', err);

      if (err.name === 'UserExistsError') {
        // Username or email already exists
        req.flash('error', 'Username or email already exists');
      } else {
        // Other registration error
        req.flash('error', 'Failed to register. Please try again.');
      }
      res.status(500).redirect('/register'); 
    });
});

// Chech logged in
router.get('/check-loggedin', async (req, res, next) => {
  if (req.isAuthenticated()) {
      const user = await userModel.findOne({
        username: req.session.passport.user});
      res.redirect('/account/' + user.username);
    } else {
      res.redirect('/login');
    }
})


// login route
router.post("/login", function(req, res, next) {
  passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/login",
    failureFlash: true // Enable failure flash messages
  })(req, res, next); // Call the authenticate middleware and pass req, res, and next
});

//logout route
router.get('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});

// Delete account route
router.get('/delete-account', isLoggedIn, async function (req, res, next) {
  let user;
  if (req.isAuthenticated()) {
    user = await userModel.findOne({
      username: req.session.passport.user});
  } else {
    user = null;
  }

    res.render('deletedAccount');

});


// Code for IsLoggedIn Middleware
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}



// Error page
router.get('/error-404_code-438362404', function (req, res, next) {
  res.render('error');
});


module.exports = router;
