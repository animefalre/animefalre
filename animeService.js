const Anime = require('./routes/animeDB'); 
const Season = require('./routes/seasonDB'); 
const Episode = require('./routes/episodeDB'); 

async function Animes() {
    try {
        const animeList = await Anime.find();
        return animeList;
    } catch (error) {
        throw new Error('Error fetching anime details');
    }
}

async function Seasons() {
    try {
        const seasonList = await Season.find();
        return seasonList;
    } catch (error) {
        throw new Error('Error fetching season details');
    }
}

async function Episodes() {
    try {
        const episodeList = await Episode.find();
        return episodeList;
    } catch (error) {
        throw new Error('Error fetching episode details');
    }
}

module.exports = {
    Animes, Seasons, Episodes
};
