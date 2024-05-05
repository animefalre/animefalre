
// Inside watchpage.js
window.addEventListener('load', function() {
    setTimeout(async function() {
        try {
            const episodeInfo = document.getElementById('episode-info');
        if (episodeInfo) {
            const animeId = episodeInfo.dataset.animeId;
            const seasonId = episodeInfo.dataset.seasonId;
            const episodeId = episodeInfo.dataset.episodeId;

            const newView = 1;
            const response = await fetch(`/views?animeId=${animeId}&episodeId=${episodeId}&seasonId=${seasonId}&viewsNum=${newView}`);
            if (!response.ok) {
                throw new Error("Response error, Please check the database and API route");
            }
        } 
        } catch (error) {
            console.error("Fetching error: " + error);
        }
    }, 15000); 
});

  