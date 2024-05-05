// routes/animeDB.js
const mongoose = require('mongoose');

const animeSchema = new mongoose.Schema({
  name: {
    type: String
  },
  animeId: {
    type: String
  },
  description: {
    type: String
  },
  poster: {
    type: String
  },
  tags: {
    type: String
  },
  season: [{ 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Season' 
  }],
  episodes: [{ 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Episode' 
  }],
  section: [{
    type: String,
  }],
  views: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Anime = mongoose.model('Anime', animeSchema);

module.exports = Anime;
