const mongoose = require('mongoose');

const seasonSchema = new mongoose.Schema({
  displayName: String, // Season 1
  seasonNo: String, // S1
  seasonId: String, // btth-S1
  seasonImg: String, // cdvfcdfv.jpg
  anime: String, // Battle through the heaven
  animeId: String, // btth
  season: Number, // 1
  episodes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Episode'
  }],
  views: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Season = mongoose.model('Season', seasonSchema);

module.exports = Season;