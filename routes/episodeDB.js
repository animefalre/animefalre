const mongoose = require('mongoose');

const episodeSchema = new mongoose.Schema({
  episodeTitle: String,
  episodeId: String,
  thumbnail: String,
  animeId: String,
  server1: String,
  server2: String,
  server3: String,
  season: String,
  episodeNo: Number,
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  views: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Episode = mongoose.model('Episode', episodeSchema);

module.exports = Episode;